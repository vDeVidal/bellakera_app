import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductoDto {
    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    precio: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    stock?: number;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    disponible?: boolean;
}