import { Global, Module } from '@nestjs/common';
import { IContextAuthServiceToken } from './context-auth.interface';
import { ContextAuthService } from './context-auth.service';

@Global()
@Module({
  providers: [
    { useClass: ContextAuthService, provide: IContextAuthServiceToken },
  ],
  exports: [
    { useClass: ContextAuthService, provide: IContextAuthServiceToken },
  ],
})
export class ContextModule {}
