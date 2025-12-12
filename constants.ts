import { SampleType } from './types';

export const SAMPLE_CODE: Record<SampleType, string> = {
  [SampleType.LEGACY_JS]: `// User Profile Update Script - v1.2 (2014)
// TODO: Refactor this to use newer API
function updateProfile(uid, d, cb) {
  var u = "http://api.legacy-system.internal/users/update.php?id=" + uid;
  var dt = d; 
  
  if (dt.name) {
    u += "&name=" + dt.name;
  }
  if (dt.email) {
     // rudimentary validation
    if(dt.email.indexOf('@') == -1) {
        alert("Bad email");
        return;
    }
    u += "&email=" + dt.email;
  }

  // Magic number for admin role
  if (dt.role == 99) {
    u += "&role=admin"; 
  }

  $.ajax({
    url: u,
    method: 'GET', // Legacy GET for updates
    success: function(r) {
      if(r == "OK") {
        $('#msg').html("<b>Success!</b>");
        if(cb) cb(true);
      } else {
        eval("var err = " + r); // Parse error JSON safely?
        console.log(err);
        if(cb) cb(false);
      }
    }
  });
}`,
  [SampleType.VULNERABLE_SQL]: `import sqlite3

def get_user_transactions(user_id, min_amount=0):
    """
    Fetches transactions for a user. 
    WARNING: Do not expose this directly to web input.
    """
    conn = sqlite3.connect('legacy_db.sqlite')
    cursor = conn.cursor()
    
    # Constructing query string
    query = "SELECT * FROM transactions WHERE user_id = '" + str(user_id) + "'"
    
    if min_amount > 0:
        query += " AND amount > " + str(min_amount)
        
    print("Executing: " + query)
    cursor.execute(query)
    
    rows = cursor.fetchall()
    conn.close()
    
    return rows

# Usage example (often found in old scripts)
# uid = input("Enter User ID: ")
# print(get_user_transactions(uid))`,
  [SampleType.SPAGHETTI_JAVA]: `public class OrderProcessor {
    public static int process(int status, boolean isVip, double total, int items) {
        int r = 0;
        if (status == 1) { // PENDING
            if (total > 1000) {
                if (isVip) {
                    r = 2; // PRIORITY_SHIPPING
                } else {
                    r = 1; // STANDARD_SHIPPING
                }
            } else {
                if (items > 10) {
                    r = 3; // BULK_PROCESSING
                } else {
                    r = 0; // HOLD
                }
            }
        } else if (status == 2) { // PAID
            r = 5; // READY
        } else {
            if (isVip) {
                // Unknown status but VIP gets benefit of doubt
                r = 1; 
            } else {
                r = -1; // ERROR
            }
        }
        
        // Post processing logic tangled here
        if (r == 2 && items < 5) {
            r = 1; // Downgrade if items low
        }
        
        return r;
    }
}`,
  [SampleType.CPP_MEMORY]: `// Legacy buffer processing
#include <iostream>
#include <cstring>

void processBuffer(char* input) {
    char buffer[50];
    
    // POTENTIAL OVERFLOW: No check on input length
    strcpy(buffer, input);
    
    std::cout << "Processing: " << buffer << std::endl;
    
    // Memory leak: allocating but never deleting
    int* temp_cache = new int[1000]; 
    temp_cache[0] = 1;
    
    // Dangling pointer risk
    char* dynamic_str = new char[20];
    strcpy(dynamic_str, "temp");
    delete[] dynamic_str;
    
    if (strlen(input) > 5) {
        // Use after free
        std::cout << dynamic_str << std::endl; 
    }
}

int main(int argc, char** argv) {
    if (argc > 1) {
        processBuffer(argv[1]);
    }
    return 0;
}`,
  [SampleType.PHP_LEGACY]: `<?php
// old_auth.php
$db = mysql_connect('localhost', 'root', '');
mysql_select_db('app_db', $db);

$username = $_POST['user'];
$password = $_POST['pass'];

// DEPRECATED & INSECURE
// No password hashing, direct variable injection
$sql = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
$result = mysql_query($sql);

if (!$result) {
    die('Invalid query: ' . mysql_error());
}

if (mysql_num_rows($result) > 0) {
    setcookie("auth", "true", time() + 3600); // Insecure cookie
    echo "Welcome back " . $username;
} else {
    echo "Login failed";
}
?>`,
  [SampleType.GO_RACE]: `package main

import (
	"fmt"
	"time"
)

// Global counter
var counter = 0

func increment() {
	// Race condition: read-modify-write is not atomic
	val := counter
	time.Sleep(10 * time.Millisecond) 
	val++
	counter = val
}

func main() {
	// Spawning multiple goroutines without synchronization (Mutex/Channels)
	for i := 0; i < 100; i++ {
		go increment()
	}

	time.Sleep(1 * time.Second)
	fmt.Printf("Final Counter: %d (Expected 100)\n", counter)
}`
};

export const APP_USER_GUIDE = `# Codebase Archaeologist User Guide

**Welcome to the excavation site.** This tool helps developers analyze, document, and fix legacy code using the power of **Gemini 3 Pro**.

## 1. Getting Started

### Analyzing Code
You have two ways to input code:
- **Paste Code**: Copy and paste your legacy snippet directly into the editor on the left.
- **Upload File**: Click the "Upload File / Image" button to load a file (.js, .py, .java, etc.).
- **Upload Image**: You can upload a screenshot of code! The AI will transcribe and analyze it.

Once your code is ready, click **Analyze Code** (or press \`Ctrl+Enter\`).

### New Session
Click **+ New Session** in the top bar to clear the workspace and start a fresh analysis. Your previous work is automatically saved to **History**.

## 2. Analysis Results

Once analyzed, explore the tabs:

- **📄 Documentation**: Generates a modern README.md with summary, installation, and usage guides. You can download this file.
- **💡 Explanation**: Provides high-level bullet points and a line-by-line breakdown of the logic.
- **🛡️ Security**: Scans for vulnerabilities (SQL Injection, XSS, Race Conditions) and suggests fixes.
- **🔧 Refactor**: Suggests modern code improvements (Clean Code, Performance).
- **💬 Assistant**: Chat with the AI about this specific code snippet.

## 3. Using the Assistant

The **Assistant** tab is context-aware. You can ask:
- *"How do I write a unit test for this function?"*
- *"Explain the variable naming convention used here."*
- *"Is this thread-safe?"*

## 4. History

Click the **History** button in the top right to view past analyses.
- **Restore**: Click any item to reload the code and results.
- **Persistence**: History is saved to your browser's local storage.

## 5. Supported Languages

We support analysis for all major languages including Python, JavaScript, Java, C++, Go, PHP, C#, Ruby, and more.`;