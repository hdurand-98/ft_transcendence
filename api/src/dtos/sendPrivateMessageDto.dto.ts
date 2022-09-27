import { Transform, TransformFnParams } from "class-transformer";
import { Length } from "class-validator";
import { IsNotEmpty } from "class-validator";
import { User } from "../user/user.entity";

export class sendPrivateMessageDto
{
	@IsNotEmpty()
	to: User;

	@IsNotEmpty()
	@Length(1, 250)
	@Transform(({ value }: TransformFnParams) => value?.trim())
	msg : string;

}
