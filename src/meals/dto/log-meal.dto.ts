import { IsString, IsNumber, IsIn, Min } from 'class-validator';

export class LogMealDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  calories: number;

  @IsNumber()
  @Min(0)
  protein: number;

  @IsNumber()
  @Min(0)
  carbs: number;

  @IsNumber()
  @Min(0)
  fat: number;

  @IsString()
  @IsIn(['breakfast', 'lunch', 'dinner', 'snack'])
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}
