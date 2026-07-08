import { IsString, IsOptional, IsDateString, MaxLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventoDto {
  @IsString() @MaxLength(200)
  nombre: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsDateString()
  fecha: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)                       // ← 0 permite eventos gratuitos
  precio: number;

  @IsOptional()                 // ← lo hacemos opcional (schema lo permite null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  aforo_maximo?: number;

  @IsOptional() @IsString()
  estado?: string;
}

export class UpdateEventoDto {
  @IsOptional() @IsString() @MaxLength(200)
  nombre?: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsDateString()
  fecha?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)                       // ← 0 permite eventos gratuitos
  precio?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  aforo_maximo?: number;

  @IsOptional() @IsString()
  estado?: string;
}