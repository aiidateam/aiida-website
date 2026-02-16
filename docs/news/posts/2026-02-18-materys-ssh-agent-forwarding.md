---
blogpost: true
category: Blog
tags: ssh, security, authentication, cloud, hpc
author: Riccardo Bertossa
date: 2026-02-18
---

# Under the Hood of the Materys Platform: Secure SSH Agent Forwarding for AiiDA

## Introduction

At **[Materys SRL](https://materys.com/)**, a SISSA startup, our mission is to democratize access to numerical simulations.
We believe the greatest barrier to broader adoption isn't the science itself—whether chemistry, physics, or materials—but the **technical complexities** of running simulations on HPC systems.
Users often struggle with low-level numerical parameters, implementation details, and the intricacies of authentication and data management, rather than the scientific questions they aim to answer.

To address these challenges, we built our cloud platform on the **AiiDA ecosystem**, leveraging its modular, plugin-based design and its ability to scale seamlessly in cloud environments.
AiiDA's open-source nature allowed us to contribute back to the community, bridging the gap between academic innovation and industrial robustness.
Our platform integrates AiiDA's Python API for simulation management and its **ProcessListener** interface to track process state changes in real time.
We also eliminated reliance on local configuration files, enabling secure, multi-user database queries using platform-managed credentials.
Finally, by adopting **distributed object storage (S3)**, we ensured scalable, reliable file storage without filesystem dependencies.

Yet, one critical challenge remained: **How could users securely authenticate to HPC systems using their own accounts, without exposing private SSH keys?** Traditional approaches—copying private keys to remote machines—introduced unacceptable security risks.
Our solution? The **Materys Agent-Forwarder System**, a secure, innovative approach to SSH authentication that keeps private keys where they belong: on the user's local machine.

This blog post dives into the technical architecture, security features, and practical deployment of our agent-forwarder system, and explains how it transforms SSH authentication for AiiDA workflows.

---

## The SSH Authentication Challenge

### SSH Key Pairs: A Robust but Problematic Standard

SSH authentication relies on **public-key cryptography**:

1. **Key Generation**: Users create a key pair (`ssh-keygen`).
2. **Public Key Distribution**: The public key is added to `~/.ssh/authorized_keys` on the remote server.
3. **Authentication**: The server challenges the client to sign a message with the private key.
4. **Verification**: The server validates the signature using the public key.

This works for direct connections in which only the **public key** is copied to remote servers, while the **private key** remains secure on the user's machine.

However, in **multi-hop distributed environments**—where AiiDA runs on cloud infrastructure and must authenticate to HPC systems on behalf of users—the traditional approach breaks down. The intermediate AiiDA machines would need access to private keys to authenticate onwards to HPC systems, introducing severe security challenges:

* **Private Key Exposure**: Unlike standard SSH, users would need to copy their **private keys** to intermediate AiiDA machines, dramatically increasing exposure.
* **Expanded Attack Surface**: Storing private keys on multiple cloud systems creates additional points of vulnerability.
* **Hardware Token Incompatibility**: Physical security devices like YubiKey or OpenPGP cards cannot be used without direct physical access to the intermediate machines.
* **Key Management Complexity**: Rotating or revoking keys across distributed systems becomes complex and error-prone.

For Materys, these limitations were unacceptable.
We needed a solution that preserved security while enabling seamless, hardware-backed authentication.

---

## The Agent-Forwarder Solution

### Architecture Overview

Our system introduces a **microservice architecture** with three core components:

1. **Platform Service**: Central coordination, running on a server with a public IP.
2. **Forwarder Client**: Runs on the user's local machine, interfacing with their SSH agent.
3. **Endpoint Service**: Deployed on AiiDA machines, enabling secure communication with HPC systems.

```bash
# [User's Local Machine]       [Materys Platform]          [AiiDA Machines]
#     │                              │                           │
#     ▼                              ▼                           ▼
# [SSH Agent] ←→ [Forwarder] ←→ [Platform] ←→ [Endpoint #1] ←→ [SSH client] ←→ [HPC System]
#                                           ←→ [Endpoint #2] ←→ [SSH client] ←→ [HPC System]
```

### Authentication Flow

The authentication process involves five key steps:

1. **Token Generation**: The platform generates a cryptographic token, stored in Redis.
2. **Configuration**: Users download a YAML config with the platform URL, token, UUID, and certificates.
3. **Forwarder Setup**: The user's `ssh-agent` socket (`$SSH_AUTH_SOCK`) is exposed to the forwarder.
4. **Endpoint Deployment**: The platform deploys endpoints in AiiDA pods.
5. **Secure Communication**: All components communicate over **QUIC** (a modern, encrypted transport protocol), with mutual TLS ensuring end-to-end encryption.

### Open Source

We decided to open-source the agent-forwarder to allow the community to truly trust it and help us grow this powerful system.

The repository is available at: https://github.com/Materys/ssh-agent-forwarder

---

## Technical Deep Dive

### Protocol Design

The system uses a **custom binary protocol** with three message types:

* **Hello (Type 1)**: Initial handshake, including UUID ("Universally Unique Identifier"), role, nonce ("number used once"), and HMAC ("Hash-based Message Authentication Code").
* **Ack (Type 2)**: Handshake acknowledgment.
* **Agent Packet (Type 3)**: SSH agent protocol messages, wrapped and HMAC-signed.

### Security Features

The system implements multiple layers of security:

* **Mutual TLS**: All QUIC connections are encrypted.
* **HMAC Protection**: Every message is signed with HMAC-SHA256.
* **Nonce Validation**: Prevents replay attacks.
* **Token-Based Authentication**: UUID/token pairs are stored in Redis, with configurable expiration.
* **Message Whitelisting**: Only safe operations are permitted.

The following code illustrates how the whitelist restricts the SSH agent protocol to authentication-only operations, blocking any attempts to add, remove, or modify keys:

```go
// SECURITY: Only minimal safe operations are allowed
SshAgentRequestWhitelist = map[AgentMsgType]string{
    SSH_AGENTC_REQUEST_IDENTITIES: "SSH_AGENTC_REQUEST_IDENTITIES",  // List keys
    SSH_AGENTC_SIGN_REQUEST:       "SSH_AGENTC_SIGN_REQUEST",        // Sign challenges
    // DANGEROUS OPERATIONS ARE BLOCKED:
    // SSH_AGENTC_ADD_IDENTITY, SSH_AGENTC_REMOVE_IDENTITY, etc.
}
```

---

## Advantages for AiiDA Workflows

### 1. Hardware Token Support

The agent-forwarder enables seamless integration with:

* **YubiKey** (OpenPGP/PIV).
* **OpenPGP Cards**.
* **GnuPG Agent** for smart card support.

### 2. Private Key Isolation

**Critical Benefit**: Private keys **never leave** the user's local machine.

* No keys on remote systems.
* No keys in AiiDA pods or databases.

### 3. Enhanced Security Posture

This architecture provides several security benefits:

* **Reduced Attack Surface**: Keys remain on trusted devices.
* **Token Revocation**: Access is revoked by removing the token.
* **Temporary Access**: Tokens can expire after a set period.
* **Audit Trail**: All authentication requests are logged.

---

## SSH Authentication Mechanism

### SSH Agent Protocol Flow

Among all the protocol message types, only two operations need to be performed to implement an authentication-only system (message types are defined in the SSH agent protocol specification):

1. **Key Listing**: `SSH_AGENTC_REQUEST_IDENTITIES` → `SSH_AGENT_IDENTITIES_ANSWER`
2. **Signing Request**: `SSH_AGENTC_SIGN_REQUEST` → `SSH_AGENT_SIGN_RESPONSE`

All SSH agent messages that are forwarded with our system are:

* Wrapped in an Agent Packet (`ProtocolMessage` Type 3, as defined above).
* HMAC-signed.
* Protected with a cryptographic nonce.
* Validated against the whitelist.

---

## Practical Deployment

### End-to-End Testing
The following script demonstrates how to set up and test all three components locally. Run these commands from the `ssh-agent-forwarder` repository root and with a running SSH agent (`eval $(ssh-agent)`):
```bash
# 1. Start Redis
docker run --name agent-forwarder-redis -p 6379:6379 -d redis:7-alpine

# 2. Set up test token
docker exec agent-forwarder-redis redis-cli set token:test-uuid-1234 test-token-1234

# 3. Generate self-signed certificates
openssl req -x509 -newkey rsa:4096 -keyout platform.key -out platform.crt \
    -days 365 -nodes -subj "/CN=localhost"

# 4. Start platform
REDIS_ADDRESS=localhost:6379 \
CERT_PATH=platform.crt \
KEY=platform.key \
PLATFORM_URL=localhost:4242 \
go run ./cmd/ssh-platform/main.go > platform.log 2>&1 &

# 5. Start forwarder
KEY_OWNER_UUID=test-uuid-1234 \
SSH_AGENT_TOKEN=test-token-1234 \
PLATFORM_URL=localhost:4242 \
CERT_PATH=platform.crt \
go run ./cmd/ssh-agent-forwarder/main.go > forwarder.log 2>&1 &

# 6. Start endpoint
KEY_OWNER_UUID=test-uuid-1234 \
SSH_AGENT_TOKEN=test-token-1234 \
PLATFORM_URL=localhost:4242 \
CERT_PATH=platform.crt \
go run ./cmd/ssh-agent-endpoint/main.go > endpoint.log 2>&1 &

# 7. Test connection
sleep 2
SSH_AUTH_SOCK=$(ls /tmp/agent-endpoint*.sock 2>/dev/null | head -1)
if [ -n "$SSH_AUTH_SOCK" ]; then
    echo "Agent socket found: $SSH_AUTH_SOCK"
    ssh-add -l
else
    echo "Agent socket not found"
fi
```

---

## Security Considerations

### Threat Model Mitigation

The following table compares how common threats are handled in traditional SSH setups versus the agent-forwarder approach:

| Threat | Traditional Approach | Agent-Forwarder Approach |
| ----- | ----- | ----- |
| Private key theft | Keys on multiple machines | Keys only on user's machine |
| Key compromise | All systems affected | Disconnect the agent and revoke single token |
| Replay attacks | Possible | Prevented by nonce validation |
| Man-in-middle | Possible | Prevented by mutual TLS |

### Best Practices

To maximize security when deploying this system:

* Use **short-lived tokens** (e.g., 24 hours).
* Prefer **hardware tokens** (YubiKey/OpenPGP).
* Restrict **platform service access**.
* Monitor **authentication attempts**.
* Rotate **TLS certificates** regularly.

---

## Performance

The system is designed for efficiency:

* **Latency**: QUIC minimizes connection overhead.
* **Throughput**: Efficient binary protocol.
* **Scalability**: Handles multiple concurrent connections.
* **Resource Usage**: Lightweight Go services.

---

## Conclusion

The Materys Agent-Forwarder System redefines SSH authentication for AiiDA workflows.
By **eliminating private key distribution**, it enables:

* **Hardware token integration** (YubiKey, OpenPGP).
* **Enhanced security** through key isolation.
* **Compliance** with strict policies.
* **Flexible access control** via tokens.

This approach is a **game-changer** for research environments, combining computational power with robust security.

---

### Reach out

You can find us on:
- [materys.com](https://materys.com/)
- [LinkedIn](https://linkedin.com/company/materys/)
- [GitHub](https://github.com/Materys/)

---

### Further Reading

For more details on the technologies used:

* [Agent-Forwarder GitHub Repository](https://github.com/Materys/ssh-agent-forwarder)
* [QUIC Protocol Specification](https://datatracker.ietf.org/doc/html/rfc9000)
* [SSH Agent Protocol Documentation](https://datatracker.ietf.org/doc/html/draft-miller-ssh-agent-00)
* [OpenSSH PROTOCOL.agent](https://github.com/openssh/openssh-portable/blob/master/PROTOCOL.agent)

---

**Riccardo Bertossa, Materys SRL**
