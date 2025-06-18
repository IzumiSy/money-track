import AppLayout from "@/components/AppLayout";

const Layout = (props: React.PropsWithChildren) => {
  return <AppLayout>{props.children}</AppLayout>;
};

export default Layout;
