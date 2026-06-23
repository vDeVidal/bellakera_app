import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateEventoDto {
  @IsString()
  @MaxLength(200)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsDateString()
  fecha_evento: string;

  @IsOptional()
  @IsString()
  estado?: string; // proximo | en_curso | finalizado
}

export class UpdateEventoDto {
  @IsOptional() @IsString() @MaxLength(200)
  nombre?: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsDateString()
  fecha_evento?: string;

  @IsOptional() @IsString()
  estado?: string;
}