import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@ApiTags('Employees')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('api/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Список всех сотрудников' })
  @ApiResponse({ status: 200, description: 'Список сотрудников' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.employeesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить данные сотрудника по ID' })
  @ApiResponse({ status: 200, description: 'Данные сотрудника' })
  @ApiResponse({ status: 404, description: 'Сотрудник не найден' })
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.employeesService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать нового сотрудника' })
  @ApiResponse({ status: 201, description: 'Сотрудник успешно создан' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные сотрудника (PATCH)' })
  @ApiResponse({ status: 200, description: 'Данные обновлены' })
  @ApiResponse({ status: 404, description: 'Сотрудник не найден' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(user.id, id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить данные сотрудника (PUT)' })
  @ApiResponse({ status: 200, description: 'Данные обновлены' })
  @ApiResponse({ status: 404, description: 'Сотрудник не найден' })
  updatePut(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить сотрудника' })
  @ApiResponse({ status: 200, description: 'Сотрудник успешно удален' })
  @ApiResponse({ status: 404, description: 'Сотрудник не найден' })
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.employeesService.remove(user.id, id);
  }
}
