import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import "../styles/AdminPanel.css";
import { User, Contact, Question } from "../interfaces";
import { getUsers, getContacts, getQuestions } from "../services/api";
import AddUserModal from "./modals/AddUserModal";
import UpdateUserModal from "./modals/UpdateUserModal";
import DeleteUserModal from "./modals/DeleteUserModal";
import AddContactModal from "./modals/AddContactModal";
import UpdateContactModal from "./modals/UpdateContactModal";
import DeleteContactModal from "./modals/DeleteContactModal";
import AddQuestionModal from "./modals/AddQuestionModal";
import UpdateQuestionModal from "./modals/UpdateQuestionModal";
import ArchiveQuestionModal from "./modals/ArchiveQuestionModal";
import { auth } from "../services/firebase"; // Import auth
import { onAuthStateChanged } from "firebase/auth";

const AdminPanel: React.FC = () => {
  // User Management modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUpdateUserModal, setShowUpdateUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);

  // Contact Management modals
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showUpdateContactModal, setShowUpdateContactModal] = useState(false);
  const [showDeleteContactModal, setShowDeleteContactModal] = useState(false);

  // Question Management modals
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showUpdateQuestionModal, setShowUpdateQuestionModal] = useState(false);
  const [showArchiveQuestionModal, setShowArchiveQuestionModal] =
    useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchUsers = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user");
      }
      const data = await getUsers();
      setUsers(data);
      setError(null); // Clear any previous errors
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Error fetching users:", error);
      if (retryCount < 3) {
        // Only retry 3 times
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchUsers(), 1000); // Retry after 1 second
      } else {
        setError(
          "Failed to load users. Please ensure you are logged in with admin privileges."
        );
      }
    }
  };

  const fetchContacts = async () => {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setError("Failed to load contacts.");
    }
  };

  const fetchQuestions = async () => {
    try {
      const data = await getQuestions();
      setQuestions(data);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to load questions.");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      setIsAuthenticated(!!user);
      if (user) {
        setLoading(true);
        try {
          // Wait for a small delay to ensure Firebase is ready
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Fetch all data in parallel
          await Promise.all([fetchUsers(), fetchContacts(), fetchQuestions()]);
        } catch (error) {
          console.error("Error fetching data:", error);
          setError("Error loading admin panel data");
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      } else {
        setError("Please log in to access the admin panel");
        setLoading(false);
      }
    });

    // Hide sidebar on mobile when component mounts
    if (window.innerWidth <= 768) {
      document.body.classList.add("sb-sidenav-toggled");
    }

    return () => {
      isMounted = false;
      unsubscribe();
      document.body.classList.remove("sb-sidenav-toggled");
    };
  }, []);

  // Refresh data when modals are closed
  const handleModalClose = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchContacts(), fetchQuestions()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="admin-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className="admin-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );

  if (!isAuthenticated)
    return (
      <div className="admin-container">
        <div className="error-message">
          Please log in to access the admin panel
        </div>
      </div>
    );

  return (
    <div className="admin-container">
      <h2>Admin Panel</h2>

      <div className="admin-section">
        <h3>User Management</h3>
        <div className="admin-buttons">
          <Button
            className="admin-button"
            onClick={() => setShowAddUserModal(true)}
          >
            Add User
          </Button>
          <Button
            className="admin-button"
            onClick={() => setShowUpdateUserModal(true)}
          >
            Update User
          </Button>
          <Button
            className="admin-button"
            onClick={() => setShowDeleteUserModal(true)}
          >
            Delete User
          </Button>
        </div>
      </div>

      <div className="admin-section">
        <h3>Contact Management</h3>
        <div className="admin-buttons">
          <Button
            className="admin-button"
            onClick={() => setShowAddContactModal(true)}
          >
            Add Contact
          </Button>
          <Button
            className="admin-button"
            onClick={() => setShowUpdateContactModal(true)}
          >
            Update Contact
          </Button>
          <Button
            className="admin-button"
            onClick={() => setShowDeleteContactModal(true)}
          >
            Delete Contact
          </Button>
        </div>
      </div>

      <div className="admin-section">
        <h3>Question Management</h3>
        <div className="admin-buttons">
          <Button
            className="admin-button"
            onClick={() => setShowAddQuestionModal(true)}
          >
            Add Question
          </Button>
          <Button
            className="admin-button"
            onClick={() => setShowUpdateQuestionModal(true)}
          >
            Update Question
          </Button>
          <Button
            className="admin-button"
            onClick={() => setShowArchiveQuestionModal(true)}
          >
            Archive Question
          </Button>
        </div>
      </div>

      {/* User Management Modals */}
      <AddUserModal
        show={showAddUserModal}
        onHide={() => {
          setShowAddUserModal(false);
          handleModalClose();
        }}
      />

      <UpdateUserModal
        show={showUpdateUserModal}
        onHide={() => {
          setShowUpdateUserModal(false);
          handleModalClose();
        }}
        users={users}
      />

      <DeleteUserModal
        show={showDeleteUserModal}
        onHide={() => {
          setShowDeleteUserModal(false);
          handleModalClose();
        }}
        users={users}
      />

      {/* Contact Management Modals */}
      <AddContactModal
        show={showAddContactModal}
        onHide={() => {
          setShowAddContactModal(false);
          handleModalClose();
        }}
      />

      <UpdateContactModal
        show={showUpdateContactModal}
        onHide={() => {
          setShowUpdateContactModal(false);
          handleModalClose();
        }}
        contacts={contacts}
      />

      <DeleteContactModal
        show={showDeleteContactModal}
        onHide={() => {
          setShowDeleteContactModal(false);
          handleModalClose();
        }}
        contacts={contacts}
      />

      {/* Question Management Modals */}
      <AddQuestionModal
        show={showAddQuestionModal}
        onHide={() => {
          setShowAddQuestionModal(false);
          handleModalClose();
        }}
      />

      <UpdateQuestionModal
        show={showUpdateQuestionModal}
        onHide={() => {
          setShowUpdateQuestionModal(false);
          handleModalClose();
        }}
        questions={questions}
      />

      <ArchiveQuestionModal
        show={showArchiveQuestionModal}
        onHide={() => {
          setShowArchiveQuestionModal(false);
          handleModalClose();
        }}
        questions={questions}
      />
    </div>
  );
};

export default AdminPanel;
