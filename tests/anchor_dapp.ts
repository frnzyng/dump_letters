import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorDapp } from "../target/types/anchor_dapp";
import * as assert from "assert";
import * as bs58 from "bs58";

describe("anchor_dapp", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.AnchorDapp as Program<AnchorDapp>;
  const provider = anchor.getProvider();
  const keyPair = anchor.web3.Keypair.generate();


  it('can send a new letter', async () => {
    // Before sending the transaction to the blockchain.
    const letter = anchor.web3.Keypair.generate();
    
    await program.methods.sendLetter('Ereh', 'sasageyoooooooooooo')
        .accounts({
            letter: letter.publicKey,
            sender: program.provider.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([letter])
        .rpc();

        // After sending the transaction to the blockchain.
        const letterAccount = await program.account.letter.fetch(letter.publicKey);
        console.log(letterAccount);

        assert.equal(letterAccount.sender.toBase58(), program.provider.publicKey.toBase58());
        assert.equal(letterAccount.receiver, 'Ereh');
        assert.equal(letterAccount.message, 'sasageyoooooooooooo');
        assert.ok(letterAccount.timestamp);
    });


  it('can send a new letter from a different sender', async () => {
    // Generate another user and airdrop them some SOL.
    const otherUser = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);

    // Call the "SendLetter" instruction on behalf of this other user.
    const letter = anchor.web3.Keypair.generate();
    await program.methods.sendLetter('Longganissa Seller', 'Salamat sa lahat!')
        .accounts({
            letter: letter.publicKey,
            sender: otherUser.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([otherUser, letter])
        .rpc();
        
        // Fetch the account details of the created letter.
        const letterAccount = await program.account.letter.fetch(letter.publicKey);
        console.log(letterAccount);

        // Ensure it has the right data.
        assert.equal(letterAccount.sender.toBase58(), otherUser.publicKey.toBase58());
        assert.equal(letterAccount.receiver, 'Longganissa Seller');
        assert.equal(letterAccount.message, 'Salamat sa lahat!');
        assert.ok(letterAccount.timestamp);
    });


    it('cannot provide a receiver name with more than 20 characters', async () => {
      try {
          const letter = anchor.web3.Keypair.generate();
          const receiverNameWith21Chars = 'x'.repeat(21);
          await program.methods.sendLetter(receiverNameWith21Chars, 'Rawr')
              .accounts({
                  letter: letter.publicKey,
                  sender: program.provider.publicKey,
                  systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([letter])
              .rpc();
      } catch (error) {
          assert.equal(error.msg, 'The provided receiver name should be 20 characters long maximum.');
          return;
      }
  
      assert.fail('The instruction should have failed with a 21-character receiver name.');
  });


    it('cannot provide a message with more than 280 characters', async () => {
      try {
          const letter = anchor.web3.Keypair.generate();
          const messageWith281Chars = 'x'.repeat(281);
          await program.methods.sendLetter('hatdog', messageWith281Chars)
              .accounts({
                  letter: letter.publicKey,
                  sender: program.provider.publicKey,
                  systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([letter])
              .rpc();
      } catch (error) {
          assert.equal(error.msg, 'The provided message should be 280 characters long maximum.');
          return;
      }
  
      assert.fail('The instruction should have failed with a 281-character message.');
  });


    it('can fetch all letters', async () => {
        const letterAccount = await program.account.letter.all();

        console.log(letterAccount);
    });


    it('can filter letters by sender', async () => {
        const senderPublicKey = program.provider.publicKey
        const letterAccounts = await program.account.letter.all([
            {
                memcmp: {
                    offset: 8, // Discriminator.
                    bytes: senderPublicKey.toBase58(),
                }
            }
        ]);
    
        assert.equal(letterAccounts.length, 21);
        assert.ok(letterAccounts.every(letterAccount => {
            return letterAccount.account.sender.toBase58() === senderPublicKey.toBase58()
        }))
    });


    it('can filter letters by receiver', async () => {
        const letterAccounts = await program.account.letter.all([
            {
                memcmp: {
                    offset: 8 + // Discriminator.
                            32 + // Author public key.
                            8 + // Timestamp.
                            4, // Topic string prefix.
                    bytes: bs58.encode(Buffer.from('hatdog')),
                }
            }
        ]);
    
        assert.equal(letterAccounts.length, 12);
        assert.ok(letterAccounts.every(letterAccount => {
            return letterAccount.account.receiver === 'hatdog'
        }))
    });
});