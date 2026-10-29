import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, position, base_salary as "baseSalary", has_rest as "hasRest", rest_days as "restDays", absent_days as "absentDays", created_at as "createdAt", updated_at as "updatedAt"
       FROM employees
       WHERE user_id = $1
       ORDER BY id ASC`,
      userId,
    );
    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      position: r.position,
      baseSalary: Number(r.baseSalary || 0),
      hasRest: Boolean(r.hasRest),
      restDays: Number(r.restDays || 0),
      absentDays: Number(r.absentDays || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));
  }

  async findOne(userId: number, id: number) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, position, base_salary as "baseSalary", has_rest as "hasRest", rest_days as "restDays", absent_days as "absentDays", created_at as "createdAt", updated_at as "updatedAt"
       FROM employees
       WHERE user_id = $1 AND id = $2`,
      userId,
      id,
    );
    if (!rows.length) {
      throw new NotFoundException(`Сотрудник #${id} не найден`);
    }
    const r = rows[0];
    return {
      id: Number(r.id),
      name: r.name,
      position: r.position,
      baseSalary: Number(r.baseSalary || 0),
      hasRest: Boolean(r.hasRest),
      restDays: Number(r.restDays || 0),
      absentDays: Number(r.absentDays || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  async create(userId: number, dto: CreateEmployeeDto) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO employees (user_id, name, position, base_salary, has_rest, rest_days, absent_days, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, name, position, base_salary as "baseSalary", has_rest as "hasRest", rest_days as "restDays", absent_days as "absentDays", created_at as "createdAt", updated_at as "updatedAt"`,
      userId,
      dto.name,
      dto.position,
      Number(dto.baseSalary || 0),
      dto.hasRest !== undefined ? dto.hasRest : true,
      Number(dto.restDays ?? 4),
      Number(dto.absentDays ?? 0),
    );
    const r = rows[0];
    return {
      id: Number(r.id),
      name: r.name,
      position: r.position,
      baseSalary: Number(r.baseSalary || 0),
      hasRest: Boolean(r.hasRest),
      restDays: Number(r.restDays || 0),
      absentDays: Number(r.absentDays || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  async update(userId: number, id: number, dto: UpdateEmployeeDto) {
    await this.findOne(userId, id);
    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [userId, id];
    let idx = 3;

    if (dto.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(dto.name);
    }
    if (dto.position !== undefined) {
      updates.push(`position = $${idx++}`);
      values.push(dto.position);
    }
    if (dto.baseSalary !== undefined) {
      updates.push(`base_salary = $${idx++}`);
      values.push(Number(dto.baseSalary));
    }
    if (dto.hasRest !== undefined) {
      updates.push(`has_rest = $${idx++}`);
      values.push(Boolean(dto.hasRest));
    }
    if (dto.restDays !== undefined) {
      updates.push(`rest_days = $${idx++}`);
      values.push(Number(dto.restDays));
    }
    if (dto.absentDays !== undefined) {
      updates.push(`absent_days = $${idx++}`);
      values.push(Number(dto.absentDays));
    }

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `UPDATE employees
       SET ${updates.join(', ')}
       WHERE user_id = $1 AND id = $2
       RETURNING id, name, position, base_salary as "baseSalary", has_rest as "hasRest", rest_days as "restDays", absent_days as "absentDays", created_at as "createdAt", updated_at as "updatedAt"`,
      ...values,
    );
    const r = rows[0];
    return {
      id: Number(r.id),
      name: r.name,
      position: r.position,
      baseSalary: Number(r.baseSalary || 0),
      hasRest: Boolean(r.hasRest),
      restDays: Number(r.restDays || 0),
      absentDays: Number(r.absentDays || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM employees WHERE user_id = $1 AND id = $2`,
      userId,
      id,
    );
    return { success: true, message: `Сотрудник #${id} успешно удален` };
  }
}
