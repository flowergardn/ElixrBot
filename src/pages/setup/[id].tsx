import type { GetStaticProps, NextPage } from "next";
import { useEffect } from "react";
import { SubmitHandler, useWatch } from "react-hook-form";
import { useForm } from "react-hook-form";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { api } from "~/utils/api";

type FormValues = {
  type: "album" | "artist";
  artist: string;
  role: string;
  amount: string;
  name?: string;
};

// TODO: Create a tRPC mutation to create the reward
// Validate everything then and there.

const SetupReward: NextPage<{ id: string }> = ({ id }) => {
  const { isError, error, data, isLoading } = api.general.getSession.useQuery(
    {
      id,
    },
    {
      staleTime: Infinity,
    }
  );

  const { mutate: createReward } = api.general.createReward.useMutation({
    onSuccess() {
      window.location.href = "/success?type=create";
    },
  });

  useEffect(() => {
    if (error) location.href = "/";
  }, [isError, error]);

  const { register, handleSubmit, control } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    createReward({
      ...data,
      sessionId: id,
    });
  };

  const doSubmit = handleSubmit(onSubmit);

  const RoleSelect = () => {
    const GrantableRoles = () => {
      if (isLoading || isError) return null;
      return (
        <>
          {data.roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </>
      );
    };
    return (
      <select className="select w-full max-w-xs" {...register("role")}>
        <option disabled selected>
          Pick a role to grant
        </option>
        <GrantableRoles />
      </select>
    );
  };

  const TypeSelect = () => {
    return (
      <select className="select my-2 w-full max-w-xs" {...register("type")}>
        <option disabled selected>
          Pick a reward type
        </option>
        <option id="artist">Artist</option>
        <option id="album">Album</option>
      </select>
    );
  };

  const NameInput = () => {
    let type = useWatch({
      control,
      name: "type",
    });

    if (!type) return null;

    if (type.toLowerCase() === "artist") return null;
    if (type.toLowerCase() !== "album") return null;

    return (
      <input
        placeholder={`${type} name`}
        className="input-bordered input my-2 w-full"
        {...register("name")}
      />
    );
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="card h-96 w-96 bg-base-200">
        <div className="card-body">
          <form onSubmit={doSubmit}>
            <input
              placeholder="Artist name"
              className="input-bordered input my-2"
              {...register("artist")}
            />
            <TypeSelect />
            <NameInput />
            <RoleSelect />
            <input
              placeholder="Amount to reach"
              className="input-bordered input my-2 w-full"
              {...register("amount")}
            />

            <button className="btn-neutral btn my-2">Save</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("no id");

  await ssg.general.getSession.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SetupReward;
