import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateUnitRequest } from './dtos/request/create-unit.request';
import { UpdateUnitRequest } from './dtos/request/update-unit.request';
import { UnitResponse } from './dtos/response/unit.response';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(companyId: string, data: CreateUnitRequest): Promise<UnitResponse> {
    // Generate next code for this company
    const last = await this.prisma.unit.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextCode = (last?.code ?? 0) + 1;

    const unit = await this.prisma.unit.create({
      data: { ...data, companyId, code: nextCode },
    });

    return this.mapToResponse(unit);
  }

  async findAll(companyId: string): Promise<UnitResponse[]> {
    const units = await this.prisma.unit.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });

    return units.map((unit) => this.mapToResponse(unit));
  }

  async findOne(companyId: string, id: string): Promise<UnitResponse> {
    const unit = await this.prisma.unit.findUnique({
      where: { id_companyId: { id, companyId } },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return this.mapToResponse(unit);
  }

  async update(
    companyId: string,
    id: string,
    data: UpdateUnitRequest,
  ): Promise<UnitResponse> {
    // Verify the unit belongs to the company
    await this.findOne(companyId, id);

    const unit = await this.prisma.unit.update({
      where: { id },
      data,
    });

    return this.mapToResponse(unit);
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Verify the unit belongs to the company
    await this.findOne(companyId, id);

    await this.prisma.unit.delete({
      where: { id },
    });
  }

  private mapToResponse(unit: any): UnitResponse {
    return {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      description: unit.description,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }
}
