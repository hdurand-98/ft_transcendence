import { Transform, TransformFnParams } from "class-transformer";
import { IsEmail, IsNotEmpty, Length } from "class-validator";

export class ModifyUserDto {

	@IsNotEmpty()
	@Length(3, 20)
	name: string;

	@IsNotEmpty()
	@IsEmail()
	mail: string;

	@IsNotEmpty()
	@Length(3, 20)
	@Transform(({ value }: TransformFnParams) => value?.trim())
	fullname: string;

	@IsNotEmpty()
	avatar_url: string;
}
