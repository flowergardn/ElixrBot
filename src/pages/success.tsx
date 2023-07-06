import { useRouter } from "next/router";

export default function Success() {
  const router = useRouter();
  const { query } = router;

  const Text = () => {
    if (query.type === "create") {
      return <p>You've successfully created that reward.</p>;
    } else if (query.type === "login") {
      return (
        <p>
          You've successfully logged in!
          <br />
          You can now close this tab 💜
        </p>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex h-screen flex-col items-center justify-center">
        <article className="prose text-center">
          <h1>Success!</h1>
          <Text />
        </article>
      </div>
    </>
  );
}
