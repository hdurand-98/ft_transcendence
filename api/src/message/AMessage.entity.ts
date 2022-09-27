import { Column, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

export abstract class AMessage  {
	@PrimaryGeneratedColumn()
	id: number;

    @Column()
	message: string;

	@CreateDateColumn({ nullable : true, type: "time"})
	sent_at: Date;
}
