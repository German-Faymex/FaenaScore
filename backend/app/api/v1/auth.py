from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.organization import OrgMember, Organization
from app.models.user import User
from app.schemas.organization import UserProfileResponse, UserOrgMembership

router = APIRouter(tags=["auth"])


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(OrgMember, Organization)
        .join(Organization, OrgMember.org_id == Organization.id)
        .where(OrgMember.user_id == user.id)
    )
    memberships = [
        UserOrgMembership(org_id=org.id, org_name=org.name, role=member.role)
        for member, org in result.all()
    ]

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        organizations=memberships,
    )
