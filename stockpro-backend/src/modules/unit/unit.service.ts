import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateUnitRequest } from './dtos/request/create-unit.request';
import { UpdateUnitRequest } from './dtos/request/update-unit.request';
import { UnitResponse } from './dtos/response/unit.response';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreateUnitRequest): Promise<UnitResponse> {
    const unit = await this.prisma.unit.create({
      data,
    });

    return this.mapToResponse(unit);
  }

  async findAll(): Promise<UnitResponse[]> {
    const units = await this.prisma.unit.findMany({
      orderBy: { name: 'asc' },
    });

    return units.map((unit) => this.mapToResponse(unit));
  }

  async findOne(id: string): Promise<UnitResponse> {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    return this.mapToResponse(unit);
  }

  async update(id: string, data: UpdateUnitRequest): Promise<UnitResponse> {
    const unit = await this.prisma.unit.update({
      where: { id },
      data,
    });

    return this.mapToResponse(unit);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.unit.delete({
      where: { id },
    });
  }

  private mapToResponse(unit: any): UnitResponse {
    return {
      id: unit.id,
      name: unit.name,
      description: unit.description,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }
}
