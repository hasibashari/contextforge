import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import {
  CreateGoalTaskDto,
  UpdateGoalTaskStatusDto,
} from './dto/goal-task.dto';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async getAllGoals() {
    return this.goalsService.getAllGoals();
  }

  @Get(':id')
  async getGoalById(@Param('id') id: string) {
    return this.goalsService.getGoalById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGoal(@Body() dto: CreateGoalDto) {
    return this.goalsService.createGoal(dto);
  }

  @Patch(':id')
  async updateGoal(@Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.goalsService.updateGoal(id, dto);
  }

  @Delete(':id')
  async deleteGoal(@Param('id') id: string) {
    return this.goalsService.deleteGoal(id);
  }

  // --- Goal AI Decomposition ---
  @Post(':id/decompose')
  async decomposeGoal(
    @Param('id') id: string,
    @Body('additionalContext') additionalContext?: string,
  ) {
    return this.goalsService.decomposeGoalWithAi(id, additionalContext);
  }

  // --- Goal Tasks ---
  @Get(':id/tasks')
  async getTasks(@Param('id') id: string) {
    return this.goalsService.getTasksByGoalId(id);
  }

  @Post(':id/tasks')
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @Param('id') goalId: string,
    @Body() dto: Omit<CreateGoalTaskDto, 'goalId'>,
  ) {
    return this.goalsService.createTask({ ...dto, goalId });
  }

  @Patch(':id/tasks/:taskId')
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateGoalTaskStatusDto,
  ) {
    return this.goalsService.updateTaskStatus(taskId, dto);
  }

  @Post(':id/tasks/:taskId/verify')
  async verifyTask(@Param('taskId') taskId: string) {
    return this.goalsService.verifyTaskWithMcp(taskId);
  }

  @Delete(':id/tasks/:taskId')
  async deleteTask(@Param('taskId') taskId: string) {
    return this.goalsService.deleteTask(taskId);
  }

  // --- Goal Evaluations ---
  @Post(':id/evaluate')
  async runEvaluation(@Param('id') id: string) {
    return this.goalsService.runDailyGoalEvaluation(id);
  }

  @Get(':id/evaluations')
  async getEvaluations(@Param('id') id: string) {
    return this.goalsService.getEvaluations(id);
  }
}
