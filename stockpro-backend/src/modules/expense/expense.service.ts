import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateExpenseTypeRequest } from './dtos/request/create-expense-type.request';
import { UpdateExpenseTypeRequest } from './dtos/request/update-expense-type.request';
import { ExpenseTypeResponse } from './dtos/response/expense-type.response';
import { CreateExpenseCodeRequest } from './dtos/request/create-expense-code.request';
import { UpdateExpenseCodeRequest } from './dtos/request/update-expense-code.request';
import { ExpenseCodeResponse } from './dtos/response/expense-code.response';
import { CreateExpenseRequest } from './dtos/request/create-expense.request';
import { UpdateExpenseRequest } from './dtos/request/update-expense.request';
import { ExpenseResponse } from './dtos/response/expense.response';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: DatabaseService) {}

  // ==================== Expense Type CRUD ====================

  async createExpenseType(
    companyId: string,
    data: CreateExpenseTypeRequest,
  ): Promise<ExpenseTypeResponse> {
    const expenseType = await this.prisma.expenseType.create({
      data: {
        name: data.name,
        description: data.description,
        companyId,
      },
    });

    return this.mapExpenseTypeToResponse(expenseType);
  }

  async findAllExpenseTypes(companyId: string, search?: string): Promise<ExpenseTypeResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const types = await this.prisma.expenseType.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return types.map((type) => this.mapExpenseTypeToResponse(type));
  }

  async findOneExpenseType(companyId: string, id: string): Promise<ExpenseTypeResponse> {
    const expenseType = await this.prisma.expenseType.findUnique({
      where: { id_companyId: { id, companyId } },
    });

    if (!expenseType) {
      throw new NotFoundException('Expense type not found');
    }

    return this.mapExpenseTypeToResponse(expenseType);
  }

  async updateExpenseType(
    companyId: string,
    id: string,
    data: UpdateExpenseTypeRequest,
  ): Promise<ExpenseTypeResponse> {
    // Verify the expense type belongs to the company
    await this.findOneExpenseType(companyId, id);
    
    try {
      const expenseType = await this.prisma.expenseType.update({
        where: { id },
        data,
      });

      return this.mapExpenseTypeToResponse(expenseType);
    } catch (error) {
      throw new NotFoundException('Expense type not found');
    }
  }

  async removeExpenseType(companyId: string, id: string): Promise<void> {
    // Verify the expense type belongs to the company
    await this.findOneExpenseType(companyId, id);
    
    try {
      await this.prisma.expenseType.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Expense type not found');
    }
  }

  // ==================== Expense Code CRUD ====================

  async createExpenseCode(
    companyId: string,
    data: CreateExpenseCodeRequest,
  ): Promise<ExpenseCodeResponse> {
    const fallbackDescription = data.description?.trim() || data.name;

    return this.prisma.$transaction(async (tx) => {
      const code = await this.generateNextExpenseCode(companyId, tx);

      const expenseCode = await tx.expenseCode.create({
        data: {
          ...data,
          companyId,
          description: fallbackDescription,
          code,
        },
        include: {
          expenseType: true,
        },
      });

      const expenseNumber = await this.generateNextExpense(companyId, tx);

      await tx.expense.create({
        data: {
          code: expenseNumber,
          description: expenseCode.name,
          expenseCodeId: expenseCode.id,
          companyId,
          date: new Date(),
        },
      });

      return this.mapExpenseCodeToResponse(expenseCode);
    });
  }

  async findAllExpenseCodes(companyId: string, search?: string): Promise<ExpenseCodeResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const codes = await this.prisma.expenseCode.findMany({
      where,
      include: {
        expenseType: true,
      },
      orderBy: { code: 'asc' },
    });

    return codes.map((code) => this.mapExpenseCodeToResponse(code));
  }

  async findOneExpenseCode(companyId: string, id: string): Promise<ExpenseCodeResponse> {
    const expenseCode = await this.prisma.expenseCode.findUnique({
      where: { id_companyId: { id, companyId } },
      include: {
        expenseType: true,
      },
    });

    if (!expenseCode) {
      throw new NotFoundException('Expense code not found');
    }

    return this.mapExpenseCodeToResponse(expenseCode);
  }

  async updateExpenseCode(
    companyId: string,
    id: string,
    data: UpdateExpenseCodeRequest,
  ): Promise<ExpenseCodeResponse> {
    // Verify the expense code belongs to the company
    await this.findOneExpenseCode(companyId, id);
    
    try {
      const expenseCode = await this.prisma.expenseCode.update({
        where: { id },
        data,
        include: {
          expenseType: true,
        },
      });

      return this.mapExpenseCodeToResponse(expenseCode);
    } catch (error) {
      throw new NotFoundException('Expense code not found');
    }
  }

  async removeExpenseCode(companyId: string, id: string): Promise<void> {
    // Verify the expense code belongs to the company
    await this.findOneExpenseCode(companyId, id);
    
    try {
      await this.prisma.expenseCode.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Expense code not found');
    }
  }

  // ==================== Expense CRUD ====================

  async createExpense(companyId: string, data: CreateExpenseRequest): Promise<ExpenseResponse> {
    const code = await this.generateNextExpense(companyId);

    const expense = await this.prisma.expense.create({
      data: {
        ...data,
        companyId,
        code,
        date: new Date(data.date),
      },
      include: {
        expenseCode: {
          include: {
            expenseType: true,
          },
        },
      },
    });

    return this.mapExpenseToResponse(expense);
  }

  async findAllExpenses(companyId: string, search?: string): Promise<ExpenseResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        {
          expenseCode: {
            name: { contains: search, mode: 'insensitive' as const },
            companyId, // Ensure related expense code belongs to the same company
          },
        },
      ];
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        expenseCode: {
          include: {
            expenseType: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return expenses.map((expense) => this.mapExpenseToResponse(expense));
  }

  async findOneExpense(companyId: string, id: string): Promise<ExpenseResponse> {
    const expense = await this.prisma.expense.findUnique({
      where: { id_companyId: { id, companyId } },
      include: {
        expenseCode: {
          include: {
            expenseType: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return this.mapExpenseToResponse(expense);
  }

  async updateExpense(
    companyId: string,
    id: string,
    data: UpdateExpenseRequest,
  ): Promise<ExpenseResponse> {
    // Verify the expense belongs to the company
    await this.findOneExpense(companyId, id);
    
    try {
      const updateData: any = { ...data };
      if (data.date) {
        updateData.date = new Date(data.date);
      }

      const expense = await this.prisma.expense.update({
        where: { id },
        data: updateData,
        include: {
          expenseCode: {
            include: {
              expenseType: true,
            },
          },
        },
      });

      return this.mapExpenseToResponse(expense);
    } catch (error) {
      throw new NotFoundException('Expense not found');
    }
  }

  async removeExpense(companyId: string, id: string): Promise<void> {
    // Verify the expense belongs to the company
    await this.findOneExpense(companyId, id);
    
    try {
      await this.prisma.expense.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Expense not found');
    }
  }

  // ==================== Private Helper Methods ====================

  private async generateNextExpenseCode(
    companyId: string,
    prisma: DatabaseService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const lastCode = await prisma.expenseCode.findFirst({
      where: { companyId },
      orderBy: { code: 'desc' },
    });

    if (!lastCode) {
      return 'EC-001';
    }

    const match = lastCode.code.match(/EC-(\d+)/);
    if (!match) {
      return 'EC-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `EC-${String(nextNumber).padStart(3, '0')}`;
  }

  private async generateNextExpense(
    companyId: string,
    prisma: DatabaseService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const lastExpense = await prisma.expense.findFirst({
      where: { companyId },
      orderBy: { code: 'desc' },
    });

    if (!lastExpense) {
      return 'MSR-001';
    }

    const match = lastExpense.code.match(/MSR-(\d+)/);
    if (!match) {
      return 'MSR-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `MSR-${String(nextNumber).padStart(3, '0')}`;
  }

  private mapExpenseTypeToResponse(expenseType: any): ExpenseTypeResponse {
    return {
      id: expenseType.id,
      name: expenseType.name,
      description: expenseType.description,
      createdAt: expenseType.createdAt,
      updatedAt: expenseType.updatedAt,
    };
  }

  private mapExpenseCodeToResponse(expenseCode: any): ExpenseCodeResponse {
    return {
      id: expenseCode.id,
      code: expenseCode.code,
      name: expenseCode.name,
      description: expenseCode.description,
      expenseTypeId: expenseCode.expenseTypeId,
      expenseType: expenseCode.expenseType
        ? {
            id: expenseCode.expenseType.id,
            name: expenseCode.expenseType.name,
          }
        : null,
      createdAt: expenseCode.createdAt,
      updatedAt: expenseCode.updatedAt,
    };
  }

  private mapExpenseToResponse(expense: any): ExpenseResponse {
    return {
      id: expense.id,
      code: expense.code,
      date: expense.date,
      description: expense.description,
      expenseCodeId: expense.expenseCodeId,
      expenseCode: expense.expenseCode
        ? {
            id: expense.expenseCode.id,
            code: expense.expenseCode.code,
            name: expense.expenseCode.name,
            expenseType: expense.expenseCode.expenseType
              ? {
                  id: expense.expenseCode.expenseType.id,
                  name: expense.expenseCode.expenseType.name,
                }
              : null,
          }
        : null,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}
