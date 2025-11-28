import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import * as XLSX from 'xlsx';
import { ItemImportService } from './item-import.service';
import type { currentUserType } from '../../../common/types/current-user.type';

const REQUIRED_HEADERS = [
  'الاسم',
  'المجموعة',
  'الوحدة',
  'سعر الشراء',
  'سعر البيع',
  'الرصيد',
  'حد الطلب',
];

const buildFile = (
  rows: Array<Array<string | number>>,
): Express.Multer.File => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  }) as Buffer;

  return {
    fieldname: 'file',
    originalname: 'items.xlsx',
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
    destination: '',
    filename: 'items.xlsx',
    path: '',
    buffer,
    stream: undefined as any,
  };
};

describe('ItemImportService', () => {
  let service: ItemImportService;
  const mockItemService = {
    create: jest.fn(),
  };
  const mockPrisma = {
    itemGroup: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    unit: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  const user = { branchId: 'branch-1' } as currentUserType;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.itemGroup.findMany.mockResolvedValue([
      { id: 'group-1', name: 'مجموعة' },
    ]);
    mockPrisma.itemGroup.create.mockResolvedValue({ id: 'group-1' });
    mockPrisma.itemGroup.findFirst.mockResolvedValue(null);
    mockPrisma.unit.findMany.mockResolvedValue([
      { id: 'unit-1', name: 'وحدة' },
    ]);
    mockPrisma.unit.create.mockResolvedValue({ id: 'unit-1' });
    mockPrisma.unit.findFirst.mockResolvedValue(null);
    service = new ItemImportService(mockItemService as any, mockPrisma as any);
  });

  it('throws when headers are missing', async () => {
    const file = buildFile([
      ['الاسم', 'المجموعة'],
      ['صنف', 'مجموعة'],
    ]);

    await expect(service.importFromExcel(file, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('imports valid rows and reports summary', async () => {
    mockItemService.create.mockResolvedValue({ id: 'item-1' });
    const file = buildFile([
      REQUIRED_HEADERS,
      ['صنف 1', 'مجموعة', 'وحدة', 10, 15, 5, 1],
    ]);

    const result = await service.importFromExcel(file, user);

    expect(mockItemService.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      totalRows: 1,
      importedCount: 1,
      failedCount: 0,
    });
  });

  it('collects row level errors without aborting', async () => {
    mockItemService.create.mockRejectedValueOnce(new Error('db error'));
    const file = buildFile([
      REQUIRED_HEADERS,
      ['صنف 1', 'مجموعة', 'وحدة', 10, 15, 5, 1],
    ]);

    const result = await service.importFromExcel(file, user);

    expect(result.failedCount).toBe(1);
    expect(result.errors[0].row).toBe(2);
  });

  it('creates missing groups and units automatically', async () => {
    mockPrisma.itemGroup.findMany.mockResolvedValue([]);
    mockPrisma.unit.findMany.mockResolvedValue([]);
    mockPrisma.itemGroup.create.mockResolvedValue({ id: 'group-new' });
    mockPrisma.unit.create.mockResolvedValue({ id: 'unit-new' });
    mockItemService.create.mockResolvedValue({ id: 'item-1' });

    const file = buildFile([
      REQUIRED_HEADERS,
      ['صنف 1', 'مجموعة جديدة', 'وحدة جديدة', 10, 15, 5, 1],
    ]);

    await service.importFromExcel(file, user);

    expect(mockPrisma.itemGroup.create).toHaveBeenCalledWith({
      data: { name: 'مجموعة جديدة' },
      select: { id: true },
    });
    expect(mockPrisma.unit.create).toHaveBeenCalledWith({
      data: { name: 'وحدة جديدة' },
      select: { id: true },
    });
    expect(mockItemService.create).toHaveBeenCalledTimes(1);
  });

  it('skips trailing empty rows without errors', async () => {
    mockPrisma.itemGroup.findMany.mockResolvedValue([
      { id: 'group-1', name: 'مجموعة' },
    ]);
    mockPrisma.unit.findMany.mockResolvedValue([
      { id: 'unit-1', name: 'وحدة' },
    ]);
    mockItemService.create.mockResolvedValue({ id: 'item-1' });

    const file = buildFile([
      REQUIRED_HEADERS,
      ['صنف 1', 'مجموعة', 'وحدة', 10, 15, 5, 1],
      ['', '', '', '', '', '', ''],
      [null, null, null, null, null, null, null],
    ]);

    const result = await service.importFromExcel(file, user);

    expect(result.totalRows).toBe(1);
    expect(result.importedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(mockItemService.create).toHaveBeenCalledTimes(1);
  });
});
