import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.7.0/github-markdown-light.min.css" integrity="sha512-SGkM+aVbH28LU9XCIf2liHNTdgijTV8e2Vzf/v6MlQThzLfGbcWlD7tXP4OnPIWBZRGjoDWBVpjDrpYB17T/uA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}