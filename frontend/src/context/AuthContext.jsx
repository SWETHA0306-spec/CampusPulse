import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const DEMO_ACCOUNTS = {
  // ── Students ────────────────────────────────────────────────────────────────
  CP038: {
    id: "CP038", name: "Rahul Verma", role: "Student",
    department: "CSE", year: 3, email: "rahul.verma@sece.ac.in", avatar: "🎓", password: "1234"
  },
  CP001: {
    id: "CP001", name: "Rudra Vala", role: "Student",
    department: "IT", year: 2, email: "rudra.vala@sece.ac.in", avatar: "🎓", password: "1234"
  },
  CP002: {
    id: "CP002", name: "Rachita Bandi", role: "Student",
    department: "CIVIL", year: 1, email: "rachita.b@sece.ac.in", avatar: "🎓", password: "1234"
  },

  // ── HODs (from hod.csv) ─────────────────────────────────────────────────────
  // Login as: anand_hod | lakshmi_hod | nandhini_hod
  anand_hod: {
    id: "anand_hod", name: "Dr. Anand Kumar", role: "HOD",
    department: "CSE", email: "vishal.mk2024aiml@sece.ac.in", avatar: "🛡️",
    departmentStudents: ["CP038", "CP001", "CP002", "CP003", "CP004", "CP005", "CP006"], password: "1234"
  },
  lakshmi_hod: {
    id: "lakshmi_hod", name: "Dr. Lakshmi P", role: "HOD",
    department: "ECE", email: "vishal.mk2024aiml@sece.ac.in", avatar: "🛡️",
    departmentStudents: [], password: "1234"
  },
  nandhini_hod: {
    id: "nandhini_hod", name: "Dr. Nandhini S", role: "HOD",
    department: "AIML", email: "vishal.mk2024aiml@sece.ac.in", avatar: "🛡️",
    departmentStudents: [], password: "1234"
  },

  // ── Faculty / Mentors (from faculty.csv) ────────────────────────────────────
  // Login as: kavitha_mentor | suresh_mentor | priya_mentor | arun_mentor
  //           divya_mentor   | harish_mentor | meena_mentor | ramesh_mentor
  kavitha_mentor: {
    id: "kavitha_mentor", name: "Dr. Kavitha R", role: "Mentor",
    department: "CSE", email: "vishal.mk2024aiml@sece.ac.in", avatar: "👨‍🏫",
    subjects: ["Machine Learning"],
    assignedStudents: ["CP038", "CP001", "CP002", "CP003", "CP004"], password: "1234"
  },
  suresh_mentor: {
    id: "suresh_mentor", name: "Dr. Suresh M", role: "Mentor",
    department: "CSE", email: "vishal.mk2024aiml@sece.ac.in", avatar: "👨‍🏫",
    subjects: ["Operating Systems"],
    assignedStudents: ["CP005", "CP006", "CP007", "CP008", "CP009"], password: "1234"
  },
  priya_mentor: {
    id: "priya_mentor", name: "Dr. Priya N", role: "Mentor",
    department: "CSE", email: "vishal.mk2024aiml@sece.ac.in", avatar: "👨‍🏫",
    subjects: ["Database Management Systems"],
    assignedStudents: ["CP010", "CP011", "CP012", "CP013", "CP014"], password: "1234"
  },
  arun_mentor: {
    id: "arun_mentor", name: "Dr. Arun K", role: "Mentor",
    department: "CSE", email: "vishal.mk2024aiml@sece.ac.in", avatar: "👨‍🏫",
    subjects: ["Computer Networks"],
    assignedStudents: ["CP015", "CP016", "CP017", "CP018", "CP019"], password: "1234"
  },
  divya_mentor: {
    id: "divya_mentor", name: "Dr. Divya S", role: "Mentor",
    department: "AIML", email: "vishal.mk2024aiml@sece.ac.in", avatar: "👨‍🏫",
    subjects: ["Artificial Intelligence"],
    assignedStudents: ["CP020", "CP021", "CP022", "CP023", "CP024"], password: "1234"
  },
  harish_mentor: {
    id: "harish_mentor", name: "Dr. Harish V", role: "Mentor",
    department: "AIML", email: "vishal.mk2024aiml@sece.ac.in", avatar: "👨‍🏫",
    subjects: ["Deep Learning"],
    assignedStudents: ["CP025", "CP026", "CP027", "CP028", "CP029"], password: "1234"
  },
  meena_mentor: {
    id: "meena_mentor", name: "Dr. Meena K", role: "Mentor",
    department: "ECE", email: "vishal.mk2024aiml@sece.ac.in", avatar: "👨‍🏫",
    subjects: ["Embedded Systems"],
    assignedStudents: ["CP030", "CP031", "CP032", "CP033", "CP034"], password: "1234"
  },
  ramesh_mentor: {
    id: "ramesh_mentor", name: "Dr. Ramesh P", role: "Mentor",
    department: "ECE", email: "vishal.mk2024aiml@sece.ac.in", avatar: "👨‍🏫",
    subjects: ["Internet of Things"],
    assignedStudents: ["CP035", "CP036", "CP037", "CP038", "CP039"], password: "1234"
  },

  // ── Legacy aliases (so existing sessions still work) ────────────────────────
  swetha_mentor: {
    id: "swetha_mentor", name: "Prof. Swetha Sharma", role: "Mentor",
    department: "CSE", email: "swetha.sharma@sece.ac.in", avatar: "👨‍🏫",
    subjects: ["Machine Learning"],
    assignedStudents: ["CP038", "CP001", "CP002", "CP003", "CP004"], password: "1234"
  },
  nitin_hod: {
    id: "nitin_hod", name: "Dr. Nitin Rao", role: "HOD",
    department: "CSE & AI", email: "nitin.rao@sece.ac.in", avatar: "🛡️",
    departmentStudents: ["CP038", "CP001", "CP002", "CP003", "CP004", "CP005", "CP006"], password: "1234"
  },
};

const DEFAULT_USER = DEMO_ACCOUNTS["CP038"]; // Default to CP038 if never logged in

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("campus_pulse_auth_user");
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("campus_pulse_auth_user", JSON.stringify(user));
        
        // Auto-fetch real name from backend if using a generic fallback name
        if (user.role === "Student" && user.name.startsWith("Student (")) {
          fetch(`/api/academic/performance/${user.id}`)
            .then((res) => {
              if (res.ok) return res.json();
              throw new Error("Failed to fetch");
            })
            .then((data) => {
              if (data.name && data.name !== user.name && data.name !== user.id) {
                setUser((prev) => ({ ...prev, name: data.name }));
              }
            })
            .catch(() => {});
        }
      } else {
        localStorage.removeItem("campus_pulse_auth_user");
      }
    } catch (e) {
      console.error("Failed to save auth state:", e);
    }
  }, [user]);

  const MASTER_PASSWORD = "1234";

  const login = (username, password) => {
    const trimmed = username.trim();

    const upper = trimmed.toUpperCase();
    const accountKey = DEMO_ACCOUNTS[trimmed] ? trimmed : (DEMO_ACCOUNTS[upper] ? upper : trimmed);

    // ── Known account lookup ─────────────────────────────────────────────────
    if (DEMO_ACCOUNTS[accountKey]) {
      if (password !== MASTER_PASSWORD) {
        return { success: false, message: "Incorrect password. Please try again." };
      }
      setUser(DEMO_ACCOUNTS[accountKey]);
      return { success: true, user: DEMO_ACCOUNTS[accountKey] };
    }

    // ── Dynamic Student Login — any CP### ID ─────────────────────────────────
    if (upper.startsWith("CP")) {
      if (password !== MASTER_PASSWORD) {
        return { success: false, message: "Incorrect password. Please try again." };
      }
      const customStudent = {
        id: upper,
        name: `Student (${upper})`,
        role: "Student",
        department: "CSE",
        year: 3,
        email: `${upper.toLowerCase()}@sece.ac.in`,
        avatar: "🎓",
        password: MASTER_PASSWORD
      };
      setUser(customStudent);
      return { success: true, user: customStudent };
    }

    return {
      success: false,
      message: "User ID not found. Try: CP038, anand_hod, lakshmi_hod, nandhini_hod, kavitha_mentor, suresh_mentor, priya_mentor, arun_mentor, divya_mentor, harish_mentor, meena_mentor, ramesh_mentor — or any CP### for a student."
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("campus_pulse_auth_user");
  };

  const selectDemoAccount = (key) => {
    if (DEMO_ACCOUNTS[key]) {
      setUser(DEMO_ACCOUNTS[key]);
      return DEMO_ACCOUNTS[key];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        selectDemoAccount,
        isAuthenticated: !!user,
        role: user?.role || "Guest"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
