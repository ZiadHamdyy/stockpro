import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryCountDto } from './create-inventory-count.dto';

export class UpdateInventoryCountDto extends PartialType(
  CreateInventoryCountDto,
) {}

