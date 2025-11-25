import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ItemService } from '../item.service';
import type { currentUserType } from '../../../common/types/current-user.type';
import type { ImportItemsResponse } from '../dtos/response/import-items.response';
import type { CreateItemRequest } from '../dtos/request/create-item.request';
import { DatabaseService } from '../../../configs/database/database.service';

type RowRecord = Record<string, unknown>;

const REQUIRED_HEADERS = [
  'الاسم',
  'المجموعة',
  'الوحدة',
  'سعر الشراء',
  'سعر البيع',
  'الرصيد',
  'حد الطلب',
] as const;

@Injectable()
export class ItemImportService {
  constructor(
    private readonly itemService: ItemService,
    private readonly prisma: DatabaseService,
  ) {}

  async importFromExcel(
    file: Express.Multer.File,
    user: currentUserType,
  ): Promise<ImportItemsResponse> {
    if (!file) {
      throw new BadRequestException('الرجاء إرفاق ملف Excel');
    }

    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      throw new BadRequestException('يجب أن يكون الملف بصيغة ‎.xlsx‎');
    }

    const workbook = this.readWorkbook(file);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('ملف Excel لا يحتوي على أوراق بيانات');
    }

    const sheet = workbook.Sheets[sheetName];
    this.validateHeaders(sheet);

    const rows = XLSX.utils.sheet_to_json<RowRecord>(sheet, {
      defval: null,
    });
    const meaningfulRows = rows
      .map((row, index) => ({ row, rowNumber: index + 2 }))
      .filter(({ row }) => !this.isRowEmpty(row));

    if (!meaningfulRows.length) {
      throw new BadRequestException('ملف Excel لا يحتوي على بيانات صالحة');
    }

    const { groupMap, unitMap } = await this.loadLookups();

    const errors: ImportItemsResponse['errors'] = [];
    let importedCount = 0;

    for (let index = 0; index < meaningfulRows.length; index++) {
      const { row, rowNumber } = meaningfulRows[index];
      try {
        const payload = await this.transformRow(row, groupMap, unitMap);
        await this.itemService.create(payload, user);
        importedCount++;
      } catch (error: any) {
        errors.push({
          row: rowNumber,
          message: error?.message ?? 'تعذر استيراد الصف',
        });
      }
    }

    return {
      totalRows: meaningfulRows.length,
      importedCount,
      failedCount: errors.length,
      errors,
    };
  }

  private readWorkbook(file: Express.Multer.File): XLSX.WorkBook {
    try {
      return XLSX.read(file.buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException('تعذر قراءة ملف Excel، تأكد من سلامته');
    }
  }

  private validateHeaders(sheet: XLSX.WorkSheet): void {
    const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      blankrows: false,
      range: 0,
      raw: false,
    })[0];

    if (!headerRow?.length) {
      throw new BadRequestException('تعذر قراءة رؤوس الأعمدة من الملف');
    }

    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !headerRow.includes(header),
    );

    if (missingHeaders.length) {
      throw new BadRequestException(
        `الأعمدة التالية مطلوبة: ${missingHeaders.join(', ')}`,
      );
    }
  }

  private async loadLookups() {
    const [groups, units] = await Promise.all([
      this.prisma.itemGroup.findMany({
        select: { id: true, name: true },
      }),
      this.prisma.unit.findMany({
        select: { id: true, name: true },
      }),
    ]);

    const groupMap = new Map(
      groups.map((group) => [this.normalize(group.name), group.id]),
    );
    const unitMap = new Map(
      units.map((unit) => [this.normalize(unit.name), unit.id]),
    );

    return { groupMap, unitMap };
  }

  private async transformRow(
    row: RowRecord,
    groupMap: Map<string, string>,
    unitMap: Map<string, string>,
  ): Promise<CreateItemRequest> {
    const name = this.getString(row['الاسم']);
    if (!name) {
      throw new Error('اسم الصنف مطلوب');
    }

    const groupName = this.getString(row['المجموعة']);
    const unitName = this.getString(row['الوحدة']);
    const groupId = await this.ensureGroupId(groupName, groupMap);
    const unitId = await this.ensureUnitId(unitName, unitMap);

    const purchasePrice = this.parseNumber(row['سعر الشراء'], 'سعر الشراء');
    const salePrice = this.parseNumber(row['سعر البيع'], 'سعر البيع');
    const stock = this.parseNumber(row['الرصيد'], 'الرصيد');
    const reorderLimit = this.parseNumber(row['حد الطلب'], 'حد الطلب');

    return {
      name,
      purchasePrice,
      salePrice,
      stock,
      reorderLimit,
      groupId,
      unitId,
      type: 'STOCKED',
    };
  }

  private async ensureGroupId(
    name: string,
    groupMap: Map<string, string>,
  ): Promise<string> {
    return this.ensureLookupId(
      name,
      groupMap,
      'المجموعة',
      () =>
        this.prisma.itemGroup.create({
          data: { name },
          select: { id: true },
        }),
      () =>
        this.prisma.itemGroup.findFirst({
          where: { name },
          select: { id: true },
        }),
    );
  }

  private async ensureUnitId(
    name: string,
    unitMap: Map<string, string>,
  ): Promise<string> {
    return this.ensureLookupId(
      name,
      unitMap,
      'الوحدة',
      () =>
        this.prisma.unit.create({
          data: { name },
          select: { id: true },
        }),
      () =>
        this.prisma.unit.findFirst({
          where: { name },
          select: { id: true },
        }),
    );
  }

  private async ensureLookupId(
    name: string,
    lookup: Map<string, string>,
    fieldName: string,
    createFn: () => Promise<{ id: string }>,
    findFn: () => Promise<{ id: string } | null>,
  ): Promise<string> {
    if (!name) {
      throw new Error(`حقل ${fieldName} مطلوب`);
    }

    const key = this.normalize(name);
    const existing = lookup.get(key);
    if (existing) {
      return existing;
    }

    try {
      const created = await createFn();
      lookup.set(key, created.id);
      return created.id;
    } catch (error: any) {
      // Handle race condition where another row created the same entry
      if (error?.code === 'P2002') {
        const fresh = await findFn();
        if (fresh?.id) {
          lookup.set(key, fresh.id);
          return fresh.id;
        }
      }
      throw new Error(`تعذر إنشاء قيمة جديدة لحقل ${fieldName}`);
    }
  }

  private parseNumber(value: unknown, fieldName: string): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    const normalizedSource =
      typeof value === 'string'
        ? value.trim()
        : String(value ?? '').trim();

    if (!normalizedSource) {
      return 0;
    }

    const normalized = Number(normalizedSource.replace(/,/g, ''));

    if (Number.isNaN(normalized)) {
      throw new Error(`القيمة في عمود ${fieldName} غير صالحة`);
    }

    return normalized;
  }

  private getString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    return String(value).trim();
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private isRowEmpty(row: RowRecord): boolean {
    return REQUIRED_HEADERS.every((header) => this.isEmptyValue(row[header]));
  }

  private isEmptyValue(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string') {
      return value.trim() === '';
    }
    return false;
  }
}


