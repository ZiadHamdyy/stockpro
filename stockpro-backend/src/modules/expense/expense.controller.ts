import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseTypeRequest } from './dtos/request/create-expense-type.request';
import { UpdateExpenseTypeRequest } from './dtos/request/update-expense-type.request';
import { ExpenseTypeResponse } from './dtos/response/expense-type.response';
import { CreateExpenseCodeRequest } from './dtos/request/create-expense-code.request';
import { UpdateExpenseCodeRequest } from './dtos/request/update-expense-code.request';
import { ExpenseCodeResponse } from './dtos/response/expense-code.response';
import { CreateExpenseRequest } from './dtos/request/create-expense.request';
import { UpdateExpenseRequest } from './dtos/request/update-expense.request';
import { ExpenseResponse } from './dtos/response/expense.response';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  // ==================== Expense Type Endpoints ====================

  @Post('types')
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['expense_types:create'] })
  async createExpenseType(
    @Body() createExpenseTypeDto: CreateExpenseTypeRequest,
    @currentCompany('id') companyId: string,
  ): Promise<ExpenseTypeResponse> {
    return this.expenseService.createExpenseType(companyId, createExpenseTypeDto);
  }

  @Get('types')
  @Auth({ permissions: ['expense_types:read'] })
  async findAllExpenseTypes(
    @currentCompany('id') companyId: string,
    @Query('search') search?: string,
  ): Promise<ExpenseTypeResponse[]> {
    return this.expenseService.findAllExpenseTypes(companyId, search);
  }

  @Get('types/:id')
  @Auth({ permissions: ['expense_types:read'] })
  async findOneExpenseType(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<ExpenseTypeResponse> {
    return this.expenseService.findOneExpenseType(companyId, id);
  }

  @Patch('types/:id')
  @Auth({ permissions: ['expense_types:update'] })
  async updateExpenseType(
    @Param('id') id: string,
    @Body() updateExpenseTypeDto: UpdateExpenseTypeRequest,
    @currentCompany('id') companyId: string,
  ): Promise<ExpenseTypeResponse> {
    return this.expenseService.updateExpenseType(companyId, id, updateExpenseTypeDto);
  }

  @Delete('types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['expense_types:delete'] })
  async removeExpenseType(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.expenseService.removeExpenseType(companyId, id);
  }

  // ==================== Expense Code Endpoints ====================

  @Post('codes')
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['expense_codes:create'] })
  async createExpenseCode(
    @Body() createExpenseCodeDto: CreateExpenseCodeRequest,
    @currentCompany('id') companyId: string,
  ): Promise<ExpenseCodeResponse> {
    return this.expenseService.createExpenseCode(companyId, createExpenseCodeDto);
  }

  @Get('codes')
  @Auth({ permissions: ['expense_codes:read'] })
  async findAllExpenseCodes(
    @currentCompany('id') companyId: string,
    @Query('search') search?: string,
  ): Promise<ExpenseCodeResponse[]> {
    return this.expenseService.findAllExpenseCodes(companyId, search);
  }

  @Get('codes/:id')
  @Auth({ permissions: ['expense_codes:read'] })
  async findOneExpenseCode(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<ExpenseCodeResponse> {
    return this.expenseService.findOneExpenseCode(companyId, id);
  }

  @Patch('codes/:id')
  @Auth({ permissions: ['expense_codes:update'] })
  async updateExpenseCode(
    @Param('id') id: string,
    @Body() updateExpenseCodeDto: UpdateExpenseCodeRequest,
    @currentCompany('id') companyId: string,
  ): Promise<ExpenseCodeResponse> {
    return this.expenseService.updateExpenseCode(companyId, id, updateExpenseCodeDto);
  }

  @Delete('codes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['expense_codes:delete'] })
  async removeExpenseCode(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.expenseService.removeExpenseCode(companyId, id);
  }

  // ==================== Expense Endpoints ====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['expenses_list:create'] })
  async createExpense(
    @Body() createExpenseDto: CreateExpenseRequest,
    @currentCompany('id') companyId: string,
  ): Promise<ExpenseResponse> {
    return this.expenseService.createExpense(companyId, createExpenseDto);
  }

  @Get()
  @Auth({ permissions: ['expenses_list:read'] })
  async findAllExpenses(
    @currentCompany('id') companyId: string,
    @Query('search') search?: string,
  ): Promise<ExpenseResponse[]> {
    return this.expenseService.findAllExpenses(companyId, search);
  }

  @Get(':id')
  @Auth({ permissions: ['expenses_list:read'] })
  async findOneExpense(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<ExpenseResponse> {
    return this.expenseService.findOneExpense(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['expenses_list:update'] })
  async updateExpense(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseRequest,
    @currentCompany('id') companyId: string,
  ): Promise<ExpenseResponse> {
    return this.expenseService.updateExpense(companyId, id, updateExpenseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['expenses_list:delete'] })
  async removeExpense(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.expenseService.removeExpense(companyId, id);
  }
}
