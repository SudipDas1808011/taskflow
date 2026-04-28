import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const client = await clientPromise;
        const db = client.db("taskdb");

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid task id" }, { status: 400 });
        }

        const updatedTask = await db.collection("tasks").findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: body },
            { returnDocument: "after" }
        );

        if (!updatedTask) {
            return NextResponse.json({ message: "Task not found" }, { status: 404 });
        }

        console.log("Update successful for ID:", id);
        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error("PUT /api/tasks/[id] error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const client = await clientPromise;
        const db = client.db("taskdb");

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid task id" }, { status: 400 });
        }

        const deletedTask = await db.collection("tasks").findOneAndDelete({
            _id: new ObjectId(id),
        });

        console.log("Delete response:", deletedTask);

        if (!deletedTask) {
            return NextResponse.json({ message: "Task not found" }, { status: 404 });
        }

        console.log("Delete successful for ID:", id);

        return NextResponse.json({
            message: "Task deleted successfully",
            data: deletedTask.value,
        });
    } catch (error) {
        console.error("DELETE /api/tasks/[id] error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
