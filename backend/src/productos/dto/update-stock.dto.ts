import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockDto {
    @Type(() => Number)
    @IsInt()
    cantidad: number; // puede ser negativo para restar
}