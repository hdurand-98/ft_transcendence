import { IsNotEmpty, IsUUID } from "class-validator";

export class uuidDto
{
	@IsUUID("all")
	@IsNotEmpty()
	uuid: string
}
