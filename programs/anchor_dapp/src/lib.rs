use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("2fdSJQEFJppVTYX7KHfDm1aJo5bg75Yvwohcf4BKfE4G");

#[program]
pub mod anchor_dapp {
    use super::*;

    pub fn send_letter(ctx: Context<SendLetter>, receiver: String, message: String) -> Result<()> {
        let letter: &mut Account<Letter> = &mut ctx.accounts.letter;
        let sender: &Signer = &ctx.accounts.sender;
        let clock: Clock = Clock::get().unwrap();

        if receiver.chars().count() > 20 {
            return Err(ErrorCode::ReceiverNameTooLong.into())
        }
    
        if message.chars().count() > 280 {
            return Err(ErrorCode::MessageTooLong.into())
        }

        letter.sender = *sender.key;
        letter.timestamp = clock.unix_timestamp;
        letter.receiver = receiver;
        letter.message = message;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SendLetter<'info> {
    #[account(init, payer = sender, space = Letter::LEN)]
    pub letter: Account<'info, Letter>,
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

// Define the structure of the letter
#[account]
pub struct Letter {
    pub sender: Pubkey,
    pub timestamp: i64,
    pub receiver: String,
    pub message: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided receiver's name should be 20 characters long maximum.")]
    ReceiverNameTooLong,
    #[msg("The provided message should be 280 characters long maximum.")]
    MessageTooLong,
}

// Sizing properties:
// Acount
const DISCRIMINATOR_LENGTH: usize = 8;
// Sender
const PUBLIC_KEY_LENGTH: usize = 32;
// Timestamp
const TIMESTAMP_LENGTH: usize = 8;
// Receiver's Name
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_RECEIVER_LENGTH: usize = 20 * 4; // 20 chars max
// Message
const MAX_MESSAGE_LENGTH: usize = 280 * 4; // 280 chars max

impl Letter {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Sender
        + TIMESTAMP_LENGTH // Timestamp
        + STRING_LENGTH_PREFIX + MAX_RECEIVER_LENGTH // Receiver's Name
        + STRING_LENGTH_PREFIX + MAX_MESSAGE_LENGTH; // Message
}