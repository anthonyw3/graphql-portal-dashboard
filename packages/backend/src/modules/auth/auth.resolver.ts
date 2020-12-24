import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import IUser from 'src/common/interface/user.interface';
import AuthService from './auth.service';
import { AuthorizationEntity, Roles } from '../../common/decorators';
import RolesEnum from '../../common/enum/roles.enum';

@Resolver('Auth')
export default class AuthResolver {
  public constructor(private readonly service: AuthService) { }

  @Mutation()
  public login(@Args('email') email: string, @Args('password') password: string): Promise<string> {
    return this.service.login(email, password);
  }

  @Mutation()
  public register(@Args('data') data: IUser): Promise<string> {
    return this.service.register(data);
  }

  // @Roles([RolesEnum.USER, RolesEnum.ADMIN])
  // @Query()
  // public getProfile(@AuthorizationEntity() user: IUser): IUser {
    // 
  // }
}
