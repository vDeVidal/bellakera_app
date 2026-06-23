import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGaleriaDto {
  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  id_evento?: number;
}