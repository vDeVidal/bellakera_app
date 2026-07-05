import { IsIn } from 'class-validator';

export class UpdateEstadoDto {
    @IsIn(['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'])
    estado: string;
}