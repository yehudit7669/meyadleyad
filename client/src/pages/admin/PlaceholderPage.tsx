interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: string;
}

export default function PlaceholderPage({ title, description, icon = '🚧' }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">{icon}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="inline-block px-6 py-3 bg-gray-100 rounded-lg text-sm text-gray-700">
          הדף בהכנה ויהיה זמין בקרוב
        </div>
      </div>
    </div>
  );
}
