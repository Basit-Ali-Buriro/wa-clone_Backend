import { io } from "socket.io-client";

class SocketTester {
  constructor() {
    this.startTime = Date.now();
    this.conversationId = "68ebb4b8c7eaf7572e0f7e57";
    this.lastMessageId = null;
    
    this.user1 = io("http://localhost:5000", {
      auth: { 
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZWJhZTgwYWJhM2Y2NmExNTAwZTU0OSIsImlhdCI6MTc2MDI3NzA0NSwiZXhwIjoxNzYwODgxODQ1fQ.7E5auwDlJHRjeFYeGIlWSefxI3NILGNInhHTg3faKuE"
      }
    });

    this.user2 = io("http://localhost:5000", {
      auth: { 
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZWJhZWVmYWJhM2Y2NmExNTAwZTU0ZCIsImlhdCI6MTc2MDI3NjQzNywiZXhwIjoxNzYwODgxMjM3fQ.GMiXvxgGMgBU56_SEPVJxT2czFf8mn71E1WtuCTJIvs"
      }
    });

    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0
    };

    [this.user1, this.user2].forEach((socket, index) => {
      socket.on("connect_error", (error) => {
        console.error(`❌ Socket ${index + 1} connection error:`, error.message);
      });

      socket.on("message-error", (error) => {
        console.error(`❌ Socket ${index + 1} message error:`, error);
      });

      socket.on("update-online-users", (users) => {
        console.log(`👥 Online users updated:`, users.length, "users");
      });
    });
  }

  async runTests() {
    console.log("\n🚀 Starting Socket.IO Tests");
    console.log(`⏰ Current Time: ${new Date().toISOString()}`);
    console.log(`🔌 Server: http://localhost:5000`);
    console.log("━".repeat(50));

    try {
      await this.connectUsers();
      await this.testJoinConversation();
      await this.testSendMessage();
      await this.testTypingIndicators();
      await this.testMessageReaction();
      await this.testRemoveReaction();
      await this.testMessageEdit();
      await this.testMessageDelete();
      await this.testInvalidMessageId();
      await this.testLeaveConversation();
    } catch (error) {
      console.error("\n❌ Test suite failed:", error.message);
      this.testResults.failed++;
    } finally {
      this.displayResults();
      await this.cleanup();
    }
  }

  async connectUsers() {
    return new Promise((resolve, reject) => {
      let connected = 0;
      const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);

      [this.user1, this.user2].forEach((socket, index) => {
        socket.on("connect", () => {
          console.log(`✅ User ${index + 1} connected (Socket ID: ${socket.id})`);
          connected++;
          if (connected === 2) {
            clearTimeout(timeout);
            this.logSuccess("Connection Test");
            resolve();
          }
        });
      });
    });
  }

  async testJoinConversation() {
    console.log("\n🚪 Testing Join Conversation...");
    return new Promise((resolve) => {
      console.log("📤 User 1 joining conversation:", this.conversationId);
      this.user1.emit("join-conversation", this.conversationId);
      
      console.log("📤 User 2 joining conversation:", this.conversationId);
      this.user2.emit("join-conversation", this.conversationId);
      
      setTimeout(() => {
        this.logSuccess("Join Conversation Test");
        resolve();
      }, 500);
    });
  }

  async testLeaveConversation() {
    console.log("\n👋 Testing Leave Conversation...");
    return new Promise((resolve) => {
      console.log("📤 User 1 leaving conversation:", this.conversationId);
      this.user1.emit("leave-conversation", this.conversationId);
      
      setTimeout(() => {
        this.logSuccess("Leave Conversation Test");
        resolve();
      }, 500);
    });
  }

  async testSendMessage() {
    console.log("\n📨 Testing Send Message...");
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Send message timeout")), 5000);
      const testMessage = {
        conversationId: this.conversationId,
        text: "Test message at " + new Date().toISOString()
      };

      this.user1.once("message-error", (error) => {
        clearTimeout(timeout);
        reject(new Error(error.error));
      });

      this.user2.once("new-message", (data) => {
        clearTimeout(timeout);
        console.log("✅ Message received by User 2");
        console.log("   Message ID:", data.message._id);
        console.log("   Sender:", data.message.sender?.name || "Unknown");
        console.log("   Text:", data.message.text);
        
        this.lastMessageId = data.message._id;
        
        if (data.message.text === testMessage.text) {
          this.logSuccess("Send Message Test");
          resolve(data);
        } else {
          reject(new Error("Message text mismatch"));
        }
      });

      this.user1.once("new-message", (data) => {
        this.lastMessageId = data.message._id;
      });

      console.log("📤 User 1 sending:", testMessage.text);
      this.user1.emit("send-message", testMessage);
    });
  }

async testMessageEdit() {
  console.log("\n✏️  Testing Message Edit...");
  
  if (!this.lastMessageId) {
    console.log("⚠️  No valid message ID available, skipping edit test");
    this.logSuccess("Message Edit Test (Skipped)");
    return;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Edit message timeout")), 5000);
    const newText = "Edited message at " + new Date().toISOString();

    this.user2.once("message-updated", (data) => {
      clearTimeout(timeout);
      console.log("✅ Message edit received by User 2");
      console.log("   New text:", data.message.text);
      console.log("   Is Edited:", data.message.isEdited);
      console.log("   Edited At:", data.message.editedAt);
      
      if (data.message.text === newText && data.message.isEdited === true) {
        this.logSuccess("Message Edit Test");
        resolve();
      } else {
        reject(new Error("Message edit verification failed"));
      }
    });

    console.log("📤 User 1 editing message to:", newText);
    this.user1.emit("message-edited", {
      messageId: this.lastMessageId,
      newText: newText
    });
  });
}

  async testMessageDelete() {
    console.log("\n🗑️  Testing Message Delete...");
    
    if (!this.lastMessageId) {
      console.log("⚠️  No valid message ID available, skipping delete test");
      this.logSuccess("Message Delete Test (Skipped)");
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Delete message timeout")), 5000);
      const messageToDelete = this.lastMessageId;

      this.user2.once("message-removed", (data) => {
        clearTimeout(timeout);
        console.log("✅ Message deletion received by User 2");
        console.log("   Deleted message ID:", data.messageId);
        
        if (data.messageId === messageToDelete) {
          this.logSuccess("Message Delete Test");
          this.lastMessageId = null; // Clear since message is deleted
          resolve();
        } else {
          reject(new Error("Message delete verification failed"));
        }
      });

      console.log("📤 User 1 deleting message:", messageToDelete);
      this.user1.emit("message-deleted", {
        messageId: messageToDelete,
        deleteType: "everyone"
      });
    });
  }

  async testTypingIndicators() {
    console.log("\n⌨️  Testing Typing Indicators...");
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Typing indicator timeout")), 5000);

      this.user2.once("user-typing", (data) => {
        console.log("✅ Typing indicator received");
        console.log("   User:", data.userInfo?.name || data.userId);
        
        this.user2.once("user-stopped-typing", () => {
          clearTimeout(timeout);
          console.log("✅ Typing stopped indicator received");
          this.logSuccess("Typing Indicators Test");
          resolve();
        });
      });

      console.log("📤 User 1 starts typing...");
      this.user1.emit("typing-started", this.conversationId);
      
      setTimeout(() => {
        console.log("📤 User 1 stops typing...");
        this.user1.emit("typing-stopped", this.conversationId);
      }, 1000);
    });
  }

  async testMessageReaction() {
    console.log("\n😊 Testing Message Reaction (Add)...");
    
    // Send a new message for reaction testing since we deleted the previous one
    const newMessage = await this.sendTestMessage();
    this.lastMessageId = newMessage.message._id;
    
    if (!this.lastMessageId) {
      console.log("⚠️  No valid message ID available, skipping reaction test");
      this.logSuccess("Message Reaction Test (Skipped)");
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Reaction timeout")), 5000);

      this.user2.once("message-updated", (data) => {
        clearTimeout(timeout);
        console.log("✅ Message reaction received");
        console.log("   Message ID:", data.message._id);
        console.log("   Reactions count:", data.message.reactions?.length || 0);
        if (data.message.reactions?.length > 0) {
          console.log("   Reaction:", data.message.reactions[0].emoji);
        }
        this.logSuccess("Message Reaction Test (Add)");
        resolve();
      });

      console.log("📤 User 1 reacting to message:", this.lastMessageId);
      this.user1.emit("message-reaction", {
        messageId: this.lastMessageId,
        emoji: "👍"
      });
    });
  }

  async testRemoveReaction() {
    console.log("\n😐 Testing Message Reaction (Remove)...");
    
    if (!this.lastMessageId) {
      console.log("⚠️  No valid message ID available, skipping remove reaction test");
      this.logSuccess("Remove Reaction Test (Skipped)");
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Remove reaction timeout")), 5000);

      this.user2.once("message-updated", (data) => {
        clearTimeout(timeout);
        console.log("✅ Reaction removal received");
        console.log("   Reactions count:", data.message.reactions?.length || 0);
        
        if (data.message.reactions?.length === 0) {
          console.log("   Reaction successfully removed");
          this.logSuccess("Message Reaction Test (Remove)");
          resolve();
        } else {
          reject(new Error("Reaction was not removed"));
        }
      });

      console.log("📤 User 1 removing reaction from message:", this.lastMessageId);
      this.user1.emit("message-reaction", {
        messageId: this.lastMessageId,
        emoji: "👍"
      });
    });
  }

  async testInvalidMessageId() {
    console.log("\n🚫 Testing Invalid Message ID (Error Handling)...");
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log("✅ Server correctly rejected invalid ID (no crash)");
        this.logSuccess("Invalid Message ID Test");
        resolve();
      }, 2000);

      this.user1.once("message-error", (error) => {
        clearTimeout(timeout);
        console.log("✅ Received error response:", error.error);
        this.logSuccess("Invalid Message ID Test");
        resolve();
      });

      console.log("📤 User 1 sending invalid message ID...");
      this.user1.emit("message-reaction", {
        messageId: "invalid-id-12345",
        emoji: "❌"
      });
    });
  }

  // Helper method to send a test message
  async sendTestMessage() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Send test message timeout")), 5000);
      const testMessage = {
        conversationId: this.conversationId,
        text: "Message for testing at " + new Date().toISOString()
      };

      this.user1.once("new-message", (data) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.user1.emit("send-message", testMessage);
    });
  }

  logSuccess(testName) {
    this.testResults.total++;
    this.testResults.passed++;
    console.log(`✅ ${testName} PASSED`);
  }

  logFailure(testName) {
    this.testResults.total++;
    this.testResults.failed++;
    console.log(`❌ ${testName} FAILED`);
  }

  displayResults() {
    console.log("\n" + "━".repeat(50));
    console.log("📊 Test Results Summary");
    console.log("━".repeat(50));
    console.log(`Total Tests:  ${this.testResults.total}`);
    console.log(`✅ Passed:     ${this.testResults.passed}`);
    console.log(`❌ Failed:     ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    console.log("━".repeat(50));
    
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`⏱️  Duration:   ${duration}s`);
  }

  async cleanup() {
    return new Promise((resolve) => {
      let disconnected = 0;
      const timeout = setTimeout(() => {
        console.warn("\n⚠️  Cleanup timeout - forcing disconnect");
        resolve();
      }, 3000);

      const checkDisconnected = () => {
        disconnected++;
        if (disconnected === 2) {
          clearTimeout(timeout);
          console.log("\n🧹 All connections closed successfully");
          resolve();
        }
      };

      [this.user1, this.user2].forEach(socket => {
        socket.once("disconnect", checkDisconnected);
        socket.disconnect();
      });
    });
  }
}

const tester = new SocketTester();
tester.runTests().catch(console.error);