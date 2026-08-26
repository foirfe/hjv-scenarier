import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import * as authenticatedRequest from './types/authenticated-request';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Log ind i systemet',
    description:
      'Godkender en bruger ud fra brugernavn/email og adgangskode samt returnerer et JWT access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login fuldført. Returnerer et authentication token.',
  })
  @ApiResponse({
    status: 401,
    description: 'Forkert brugernavn/email eller adgangskode.',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Hent den nuværende bruger',
    description:
      'Returnerer profiloplysninger for den indloggede bruger baseret på det medsendte Bearer token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Brugerens profiloplysninger blev hentet succesfuldt.',
  })
  @ApiResponse({
    status: 401,
    description: 'Ugyldigt eller manglende Bearer token.',
  })
  getMe(@Req() request: authenticatedRequest.AuthenticatedRequest) {
    return this.authService.getMe(request.user.sub);
  }
}
