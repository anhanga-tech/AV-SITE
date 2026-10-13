import { useState, type FormEvent } from "react";
import { revokeEmailMarketing } from "@/lib/consent-registration";

type Status = "idle" | "sending" | "ok" | "invalid" | "unavailable";

export function EmailMarketingRevoke() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>("idle");

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus("sending");
        const result = await revokeEmailMarketing(email);
        setStatus(result);
    };

    return (
        <form
            onSubmit={(event) => {
                void onSubmit(event);
            }}
            className="mt-4 space-y-2 font-inter"
            aria-label="Revogar comunicações por e-mail"
        >
            <p>Informe o e-mail usado no cadastro para encerrar o envio de novidades e ofertas. A revogação vale para esse endereço em todos os formulários em que ele tenha sido aceito.</p>
            <div className="flex flex-col sm:flex-row gap-2">
                <label className="sr-only" htmlFor="email-marketing-revoke">E-mail</label>
                <input
                    id="email-marketing-revoke"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                />
                <button
                    type="submit"
                    disabled={status === "sending"}
                    className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
                >
                    {status === "sending" ? "Registrando…" : "Revogar comunicações"}
                </button>
            </div>
            {status === "ok" && (
                <p role="status">Registramos o pedido de revogação. Se esse e-mail estiver na base de comunicações, ele deixa de receber novidades.</p>
            )}
            {status === "invalid" && (
                <p role="alert">Informe um e-mail válido.</p>
            )}
            {status === "unavailable" && (
                <p role="alert">Não foi possível registrar agora. Tente de novo ou escreva para privacidade@anhanga.tur.br.</p>
            )}
        </form>
    );
}
