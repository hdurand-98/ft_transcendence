import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, Length } from "class-validator";

export class twoFaDto {
	@ApiProperty({
		type: 'string',
		title: 'token',
		maxLength: 6,
		minLength: 6
	})
	@IsNotEmpty()
	@Length(6, 6)
	@IsNumberString()
	token: string
}
