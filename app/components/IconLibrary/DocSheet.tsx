import {Icon, Props} from "outline-icons";
import React from "react";

export default function DocSheet(
    props: Props
): React.ReactElement<React.ComponentProps<any>, any> {
    return (
        <Icon {...props}>
            <path d="M18 8.65333L13.3467 4V8.65333H18Z"/>
            <path
                d="M12 8.58667V4H7.31333C6.58667 4 6 4.58667 6 5.31333V18.6867C6 19.4133 6.58667 20 7.31333 20H16.6867C17.4133 20 18 19.4133 18 18.6867V10H13.4133C12.6333 10 11.9933 9.36667 11.9933 8.58L12 8.58667Z"/>
        </Icon>
    );
}