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

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  // ==================== Expense Type Endpoints ====================

  @Post('types')
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['expense_types:create'] })
  async createExpenseType(
    @Body() createExpenseTypeDto: CreateExpenseTypeRequest,
  ): Promise<ExpenseTypeResponse> {
    return this.expenseService.createExpenseType(createExpenseTypeDto);
  }

  @Get('types')
  @Auth({ permissions: ['expense_types:read'] })
  async findAllExpenseTypes(
    @Query('search') search?: string,
  ): Promise<ExpenseTypeResponse[]> {
    return this.expenseService.findAllExpenseTypes(search);
  }

  @Get('types/:id')
  @Auth({ permissions: ['expense_types:read'] })
  async findOneExpenseType(
    @Param('id') id: string,
  ): Promise<ExpenseTypeResponse> {
    return this.expenseService.findOneExpenseType(id);
  }

  @Patch('types/:id')
  @Auth({ permissions: ['expense_types:update'] })
  async updateExpenseType(
    @Param('id') id: string,
    @Body() updateExpenseTypeDto: UpdateExpenseTypeRequest,
  ): Promise<ExpenseTypeResponse> {
    return this.expenseService.updateExpenseType(id, updateExpenseTypeDto);
  }

  @Delete('types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['expense_types:delete'] })
  async removeExpenseType(@Param('id') id: string): Promise<void> {
    return this.expenseService.removeExpenseType(id);
  }

  // ==================== Expense Code Endpoints ====================

  @Post('codes')
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['expense_codes:create'] })
  async createExpenseCode(
    @Body() createExpenseCodeDto: CreateExpenseCodeRequest,
  ): Promise<ExpenseCodeResponse> {
    return this.expenseService.createExpenseCode(createExpenseCodeDto);
  }

  @Get('codes')
  @Auth({ permissions: ['expense_codes:read'] })
  async findAllExpenseCodes(
    @Query('search') search?: string,
  ): Promise<ExpenseCodeResponse[]> {
    return this.expenseService.findAllExpenseCodes(search);
  }

  @Get('codes/:id')
  @Auth({ permissions: ['expense_codes:read'] })
  async findOneExpenseCode(
    @Param('id') id: string,
  ): Promise<ExpenseCodeResponse> {
    return this.expenseService.findOneExpenseCode(id);
  }

  @Patch('codes/:id')
  @Auth({ permissions: ['expense_codes:update'] })
  async updateExpenseCode(
    @Param('id') id: string,
    @Body() updateExpenseCodeDto: UpdateExpenseCodeRequest,
  ): Promise<ExpenseCodeResponse> {
    return this.expenseService.updateExpenseCode(id, updateExpenseCodeDto);
  }

  @Delete('codes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['expense_codes:delete'] })
  async removeExpenseCode(@Param('id') id: string): Promise<void> {
    return this.expenseService.removeExpenseCode(id);
  }

  // ==================== Expense Endpoints ====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['expenses_list:create'] })
  async createExpense(
    @Body() createExpenseDto: CreateExpenseRequest,
  ): Promise<ExpenseResponse> {
    return this.expenseService.createExpense(createExpenseDto);
  }

  @Get()
  @Auth({ permissions: ['expenses_list:read'] })
  async findAllExpenses(
    @Query('search') search?: string,
  ): Promise<ExpenseResponse[]> {
    return this.expenseService.findAllExpenses(search);
  }

  @Get(':id')
  @Auth({ permissions: ['expenses_list:read'] })
  async findOneExpense(@Param('id') id: string): Promise<ExpenseResponse> {
    return this.expenseService.findOneExpense(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['expenses_list:update'] })
  async updateExpense(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseRequest,
  ): Promise<ExpenseResponse> {
    return this.expenseService.updateExpense(id, updateExpenseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['expenses_list:delete'] })
  async removeExpense(@Param('id') id: string): Promise<void> {
    return this.expenseService.removeExpense(id);
  }
}
