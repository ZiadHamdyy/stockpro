import { IsArray, IsString } from 'class-validator';

export class AssignPermissionsRequest {
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
