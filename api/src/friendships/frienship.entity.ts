import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('Friendships')
export class Friendships extends BaseEntity {

	/**
	 * Match id
	 */
	@PrimaryGeneratedColumn("uuid")
	id: string;

	/**
	 * Sender id
	 */
	@Column("uuid")
	sender: string;

	/**
	 * Target id
	 */
	@Column("uuid")
	target: string;

	/**
	 * Status
	 * @details will be set to "pending" or "accepted"
	 */
	@Column()
	status: string;
}
