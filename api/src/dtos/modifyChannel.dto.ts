import { Transform, TransformFnParams } from "class-transformer";
import { IsNotEmpty, Length } from "class-validator";

export class ModifyChannelDto {

	@IsNotEmpty()
	@Length(1, 12)
	chanName: string;

	@Length(1, 12)
	@Transform(({ value }: TransformFnParams) => value?.trim())
	password?: string;
}
