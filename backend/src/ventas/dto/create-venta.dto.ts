import {
    IsArray, IsInt, IsOptional, IsString, ValidateNested, Min, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ItemVentaDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    producto_id?: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    cantidad: number;

    @IsOptional()
    @IsString()
    notas?: string;
}

export class CreateVentaDto {
    @IsIn(['ENTRADA', 'BEBIDA'])
    tipo_venta: 'ENTRADA' | 'BEBIDA';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    usuario_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    evento_id?: number;

    @IsOptional()
    @IsIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'])
    metodo_pago?: string;

    @IsOptional()
    @IsString()
    notas?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemVentaDto)
    items: ItemVentaDto[];
}