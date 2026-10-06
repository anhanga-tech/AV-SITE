export function NpsInvalidLink() {
  return (
    <div className="nps-thank-card text-center">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">Link inválido</h1>
      <p className="text-base text-slate-400 leading-7">
        Este link de avaliação não é válido ou já expirou. Abra novamente o link do e-mail
        ou solicite um novo à nossa equipe.
      </p>
    </div>
  );
}
