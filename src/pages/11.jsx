// src/pages/NewProject.jsx

// ... outros imports
import { Alert, AlertDescription } from '@/components/ui/alert'; // Importe o componente de alerta

export default function NewProject() {
  // ... outros states
  const [error, setError] = useState(null); // <--- ADICIONE ESTA LINHA
  // ...

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || products.length === 0) return;

    setIsCreating(true);
    setError(null); // <--- LIMPE O ERRO ANTERIOR

    try {
      // ... (lógica existente para criar projeto e produtos) ...
    } catch (err) {
      console.error("Erro ao criar projeto ou produtos:", err);
      setError(err.message || "Ocorreu uma falha. Verifique os dados e tente novamente."); // <--- ATUALIZE O ESTADO DE ERRO
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ... */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Adicione este bloco para exibir o erro */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          {/* ... resto do seu JSX ... */}
        </Card>
        {/* ... */}
      </form>
    </div>
  );
}