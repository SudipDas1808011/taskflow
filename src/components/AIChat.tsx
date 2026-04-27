export default function AIChat() {
  return (
    <div className="border-2 border-black flex flex-col h-full bg-white">
      <div className="flex-1 flex items-center justify-center p-4">
        <h2 className="text-3xl font-bold rotate-[-12deg] opacity-70">Ai Chat Interface</h2>
      </div>
      <div className="border-t-2 border-black p-2">
        <input 
          type="text" 
          placeholder="Type here" 
          className="w-full border border-black p-2 focus:outline-none"
        />
      </div>
    </div>
  );
}