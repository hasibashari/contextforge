import { Controller, Get } from '@nestjs/common';
import { EcosystemService } from './ecosystem.service';

@Controller('api/ecosystem')
export class EcosystemController {
  constructor(private readonly service: EcosystemService) {}

  @Get('agents')
  getAgents() {
    const data = this.service.getAgents();
    return { success: true, data };
  }

  @Get('skills')
  getSkills() {
    const data = this.service.getSkills();
    return { success: true, data };
  }
}
