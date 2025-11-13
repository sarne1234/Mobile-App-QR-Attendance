import { useState, useEffect } from "react";
import { supabase } from "./supabase-client";
import "./App.css";

// Define the Task type
interface Task {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
  video_url?: string | null;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [newDescription, setNewDescription] = useState("");
  const [taskImage, setTaskImage] = useState<File | null>(null);
  const [taskVideo, setTaskVideo] = useState<File | null>(null);

  // ✅ Ensure Supabase has an anonymous session
  useEffect(() => {
    const init = async () => {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) console.error("Auth error:", error.message);
      else console.log("✅ Anonymous session active");
    };
    init();
  }, []);

  // --- UPLOAD FILE TO SUPABASE STORAGE ---
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const filePath = `${folder}/${Date.now()}-${file.name}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("notes-images") // bucket name
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("❌ Upload error:", uploadError.message);
        return null;
      }

      // Get the public URL after upload
      const { data } = supabase.storage
        .from("notes-images")
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        console.error("⚠️ No public URL returned:", data);
        return null;
      }

      console.log("✅ Uploaded file URL:", data.publicUrl);
      return data.publicUrl;
    } catch (err) {
      console.error("Unexpected upload error:", err);
      return null;
    }
  };

  // --- HANDLERS ---
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskImage(e.target.files[0]);
    }
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskVideo(e.target.files[0]);
    }
  };

  // --- CREATE TASK ---
  const createTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let imageUrl: string | null = null;
    let videoUrl: string | null = null;

    if (taskImage) imageUrl = await uploadFile(taskImage, "images");
    if (taskVideo) videoUrl = await uploadFile(taskVideo, "videos");

    const { error } = await supabase.from("tasks").insert([
      {
        title: newTask.title,
        description: newTask.description,
        image_url: imageUrl,
        video_url: videoUrl,
      },
    ]);

    if (error) {
      console.error("❌ Insert error:", error.message);
    } else {
      console.log("✅ Task added successfully!");
      setNewTask({ title: "", description: "" });
      setTaskImage(null);
      setTaskVideo(null);
      fetchTasks();
    }
  };

  // --- READ TASKS ---
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("id", { ascending: false });

    if (error) console.error("Read error:", error.message);
    else setTasks(data as Task[]);
  };

  // --- UPDATE TASK ---
  const updateTask = async (id: number) => {
    const { error } = await supabase
      .from("tasks")
      .update({ description: newDescription })
      .eq("id", id);

    if (error) console.error("Update error:", error.message);
    else {
      console.log("✅ Task updated");
      setNewDescription("");
      fetchTasks();
    }
  };

  // --- DELETE TASK ---
  const deleteTask = async (id: number) => {
    if (!window.confirm("Delete this task?")) return;

    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) console.error("Delete error:", error.message);
    else {
      console.log("✅ Task deleted");
      fetchTasks();
    }
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- UI ---
  return (
    <div className="App-Container">
      <h2>Task Image & Video</h2>

      <form onSubmit={createTask}>
        <input
          type="text"
          placeholder="Title Here"
          value={newTask.title}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />

        <textarea
          placeholder="Description Here"
          value={newTask.description}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, description: e.target.value }))
          }
          required
        />

        <input type="file" accept="image/*" onChange={handleImage} required />
        <input type="file" accept="video/*" onChange={handleVideo} required />

        <button type="submit">Add Task</button>
      </form>

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <div>
              <h1>{task.title}</h1>
              <p>{task.description}</p>

              {task.image_url && (
                <img
                  src={task.image_url}
                  alt="Uploaded"
                  width="320"
                  style={{ borderRadius: "10px", marginTop: "10px" }}
                />
              )}

              {task.video_url && (
                <video
                  src={task.video_url}
                  controls
                  width="320"
                  style={{ marginTop: "10px", borderRadius: "10px" }}
                />
              )}

              <textarea
                placeholder="Edit description here"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />

              <button onClick={() => updateTask(task.id)}>Update</button>
              <button onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
