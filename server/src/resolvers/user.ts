import argon2 from 'argon2';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../entities/User';
import { MyContext } from '../types';

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  me(@Ctx() { em, req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    const user = em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') { username, password }: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ) {
    if (username.length <= 3) {
      return {
        errors: [
          {
            field: 'username',
            message: 'Username must be at least 4 characters',
          },
        ],
      };
    }

    if (password.length <= 3) {
      return {
        errors: [
          {
            field: 'password',
            message: 'Password must be at least 4 characters',
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(password);
    let user;
    try {
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: username,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      user = result[0];
    } catch (error) {
      if (error.code === '23505') {
        //error.details.includes('already exists')
        return {
          errors: [
            {
              field: 'username',
              message: 'That username has already been taken',
            },
          ],
        };
      }
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') { username, password }: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username });

    if (!user) {
      return {
        errors: [{ field: 'username', message: "That username doesn't exist" }],
      };
    }

    const valid = await argon2.verify(user.password, password);

    if (!valid) {
      return {
        errors: [{ field: 'password', message: 'Your password is incorrect' }],
      };
    }

    req.session.userId = user.id;

    return {
      user,
    };
  }
}
