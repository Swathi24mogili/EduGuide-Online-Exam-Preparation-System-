# 🎓 EduGuide – Online Exam Preparation System

An interactive, dynamic dynamic full-stack examination preparation portal built to support student entrance review sessions. 

This repository leverages **Java Standard Technology Stack (J2EE Servlets, State Sessions, JDBC, and MySQL)** for production deployments, coupled with a showcase system built using **Express Node + React Vite** for fast sandbox inspection!

---

## 🚀 Key Learning Modules

### 1. Student Module
- **Registration & Key Validation**: Robust session security parameters.
- **Dynamic Documents Reader**: Built-in simulator to read study material PDF worksheets cleanly.
- **Dynamic Boards Paper Directory**: Searchable reference of prior year university examinations.
- **Mock Test Simulator**: Complete counting-down practice portal, calculating scores, tracking accuracy metrics, saving bookmark indexes, and displaying detailed explanation guides.
- **Candidate Performance Analytics**: Dashboard reports calculating profile completion.
- **Daily Exam Trivia**: Quick-fire single-choice questions to boost knowledge levels.
- **AI Career Planner**: Generative syllabus planning recommendations powered by server-side **Gemini API**.

### 2. Admin Module
- **Administrative Central Dashboard**: Global state overview monitors student progress levels and review blogs.
- **Content Upload Engine**: Interactive forms to upload study resources and prior exam files into the relational database.
- **Subject & Topic Management**: Complete CRUD interfaces modifying course syllabus criteria.
- **Announcements Broadcast System**: Dispatch system notifications directly onto student modules.

---

## 📂 Project Directory Structure (Dynamic JEE Layout)

This matches the exact dynamic web workspace expected in **Eclipse IDE / IntelliJ**:

```
EduGuide-System/
│
├── WebContent/                     # UI Web Assets
│   ├── WEB-INF/
│   │   ├── lib/                    # Project Dependencies
│   │   │   └── mysql-connector-j-8.x.jar  
│   │   └── web.xml                 # Web Deployment Descriptor
│   │
│   ├── css/                        # Global Styling
│   ├── js/                         # Dynamic Components
│   ├── index.jsp                   # Home Page Welcome Gateway
│   ├── login.jsp                   # Multi-role Login interface
│   ├── register.jsp                # Student Registration form
│   ├── dashboard.jsp               # Student Operations Console
│   ├── admin_dashboard.jsp         # Administration Command Panel
│   └── mocktest_hub.jsp            # Practice Exam Portal
│
├── src/main/java/                  # Core Back-End Java Classes
│   └── com/eduguide/
│       ├── controller/             # Servlets (Handles MVC Actions)
│       │   ├── AuthServlet.java
│       │   └── MockTestServlet.java
│       │
│       ├── dao/                    # Database Operations (JDBC Calls)
│       │   └── StudentDAO.java
│       │
│       ├── model/                  # POJO / Java Bean Classes
│       │   ├── Student.java
│       │   ├── Subject.java
│       │   └── MockTest.java
│       │
│       └── util/                   # Utility Layer (Connection Providers)
│           └── DBConnection.java
│
└── schema.sql                      # Complete Relational Database Script
```

---

## 🛠️ Step-by-Step Setup and Deployment

### 1. Prerequisite Checklist
Install the following utilities onto your computer:
- **Java Platform Development Kit (JDK 11+)**
- **Apache Tomcat Server v9.0**
- **MySQL Database Server v8.0**
- **Eclipse IDE for Enterprise Java and Web Developers**

### 2. Relational Database Seeding
Open your favorite MySQL command prompt or Workbench connection:
1. Initialize the database schema:
   ```sql
   CREATE DATABASE eduguide;
   USE eduguide;
   ```
2. Open and copy the complete definitions lines inside `schema.sql` (found in root or via the Export view) and run them.
3. Verify that 12 tables are generated perfectly:
   ```sql
   SHOW TABLES;
   ```
4. Verify root connection variables inside `src/main/java/com/eduguide/util/DBConnection.java` match your computer's MySQL setup.

### 3. Importing Dynamic Project into Eclipse
1. Launch eclipse, identify a Workspace Directory.
2. Select **File -> Import... -> General -> Projects from Folder or Archive**.
3. Browse and point directory target to this root repository and load it.
4. Right click the imported project name, browse to **Properties -> Target Runtimes**.
5. Check **New -> Apache Tomcat v9.0**, browse to point to your extracted local Tomcat folder. Click **Apply**.
6. Ensure your MySQL connector driver (`mysql-connector-j-8.x.jar`) is visible under `WebContent/WEB-INF/lib/` (or add it directly).

### 4. Direct Execution
1. Right click on the root project name.
2. Select **Run As -> Run on Server**.
3. Highlight **Tomcat v9.0** and hit **Finish**.
4. Database reports line: `JDBC Connection initialized successfully!`
5. Launch Chrome explorer at `http://localhost:8080/EduGuide/`!

---

## 🌟 Resume & Placement Highlights

- **MVC Structural Strategy**: Dedicated separation of view layers (Servlets) from transactional access engines (DAO), ensuring highly readable corporate coding guidelines.
- **Thread-Safe Singleton Connection**: Single pool JDBC references avoid connection leaks.
- **SQL Transaction Constraints**: Uses programmatic SQL commits and rolls back in Student testing sessions to defend ledger values.
