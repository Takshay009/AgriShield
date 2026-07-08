import os
import json
from web3 import Web3

RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

def log_to_blockchain(claim_id: int, proof_data: str) -> str:
    if not RPC_URL or not PRIVATE_KEY or not CONTRACT_ADDRESS:
        # Fallback to mock
        import uuid
        return f"0xmock{uuid.uuid4().hex}"
        
    try:
        w3 = Web3(Web3.HTTPProvider(RPC_URL))
        if not w3.is_connected():
            print("Web3 connection failed")
            return ""

        account = w3.eth.account.from_key(PRIVATE_KEY)
        
        # Extremely simple mock ABI for the purpose of the integration
        # In a real scenario, this ABI must match the deployed smart contract
        contract_abi = [
            {
                "inputs": [
                    {"internalType": "uint256", "name": "claimId", "type": "uint256"},
                    {"internalType": "string", "name": "proofData", "type": "string"}
                ],
                "name": "logClaim",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
        
        contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=contract_abi)
        
        nonce = w3.eth.get_transaction_count(account.address)
        
        tx = contract.functions.logClaim(claim_id, proof_data).build_transaction({
            'chainId': w3.eth.chain_id,
            'gas': 2000000,
            'maxFeePerGas': w3.eth.gas_price * 2,
            'maxPriorityFeePerGas': w3.eth.gas_price,
            'nonce': nonce,
        })
        
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        return w3.to_hex(tx_hash)
    except Exception as e:
        print(f"Web3 transaction error: {e}")
        import uuid
        return f"0xmock{uuid.uuid4().hex}"
